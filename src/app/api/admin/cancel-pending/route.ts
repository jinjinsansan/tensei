import { NextResponse } from 'next/server';

import { fetchAuthedContext } from '@/lib/app/session';
import { getServiceSupabase } from '@/lib/supabase/service';
import { grantTickets } from '@/lib/data/tickets';

type RequestBody = {
  userId: string;
  // 返還するチケット種別（デフォルト: basic）
  ticketCode?: string;
};

// Admin: 指定ユーザーの未付与 gacha_results を全件キャンセルし、チケットを返還する
// 10連1チケット消費のため: 返還枚数 = ceil(未付与件数 / 10)
export async function POST(request: Request) {
  const supabase = getServiceSupabase();

  const context = await fetchAuthedContext(supabase).catch(() => null);
  if (!context || !context.user.is_admin) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const { userId, ticketCode = 'basic' } = body;
  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  // 未付与件数を取得
  const { data: pendingRows, error: fetchError, count } = await supabase
    .from('gacha_results')
    .select('id', { count: 'exact' })
    .eq('app_user_id', userId)
    .eq('card_awarded', false)
    .limit(1);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const pendingCount = count ?? 0;
  if (pendingCount === 0) {
    return NextResponse.json({ success: true, message: '未付与の結果はありません', cancelled: 0, ticketsRefunded: 0 });
  }

  // 10連1チケット: 切り上げで返還枚数を計算
  const ticketsToRefund = Math.ceil(pendingCount / 10);

  // gacha_results を card_awarded=true（キャンセル扱い）+ history を cancelled に更新
  // まず対象の全IDを取得
  const { data: allPending, error: allFetchError } = await supabase
    .from('gacha_results')
    .select('id, history_id')
    .eq('app_user_id', userId)
    .eq('card_awarded', false)
    .limit(500);

  if (allFetchError) {
    return NextResponse.json({ error: allFetchError.message }, { status: 500 });
  }

  const rows = allPending ?? [];
  const resultIds = rows.map((r) => r.id);
  const historyIds = rows.map((r) => r.history_id).filter(Boolean) as string[];

  // gacha_results: card_awarded=true, completed_at=now（キャンセルとして完了扱い）
  const { error: updateResultsError } = await supabase
    .from('gacha_results')
    .update({ card_awarded: true, completed_at: new Date().toISOString() })
    .in('id', resultIds);

  if (updateResultsError) {
    return NextResponse.json({ error: updateResultsError.message }, { status: 500 });
  }

  // gacha_history: result='cancelled' に更新
  if (historyIds.length > 0) {
    await supabase
      .from('gacha_history')
      .update({ result: 'cancelled', result_detail: 'Admin によるキャンセル・チケット返還' })
      .in('id', historyIds);
  }

  // チケット返還
  const newBalance = await grantTickets(supabase, userId, ticketCode, ticketsToRefund);

  return NextResponse.json({
    success: true,
    cancelled: resultIds.length,
    ticketsRefunded: ticketsToRefund,
    ticketCode,
    newBalance,
  });
}
