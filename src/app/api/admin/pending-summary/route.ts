import { NextResponse } from 'next/server';

import { fetchAuthedContext } from '@/lib/app/session';
import { getServiceSupabase } from '@/lib/supabase/service';

// 未付与サマリー（24h超・不正検知）をAdmin向けに返す
export async function GET(request: Request) {
  const supabase = getServiceSupabase();
  const context = await fetchAuthedContext(supabase).catch(() => null);
  if (!context || !context.user.is_admin) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  let baseQuery = supabase
    .from('gacha_results')
    .select('id, app_user_id, created_at, card_awarded', { count: 'exact' })
    .eq('card_awarded', false);

  if (userId) {
    baseQuery = baseQuery.eq('app_user_id', userId);
  }

  // 24h超の未付与
  const { data: overdueData, count: overdueCount } = await supabase
    .from('gacha_results')
    .select('id, app_user_id, created_at', { count: 'exact' })
    .eq('card_awarded', false)
    .lt('created_at', cutoff24h)
    .limit(userId ? 100 : 10);

  // 全未付与件数
  const { count: totalPending } = await baseQuery.limit(1);

  // 未付与件数上位ユーザーを簡易集計
  const { data: allPending } = await supabase
    .from('gacha_results')
    .select('app_user_id')
    .eq('card_awarded', false)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .limit(500);

  const userPendingCounts: Record<string, number> = {};
  for (const row of allPending ?? []) {
    if (!row.app_user_id) continue;
    userPendingCounts[row.app_user_id] = (userPendingCounts[row.app_user_id] ?? 0) + 1;
  }

  const suspicious = Object.entries(userPendingCounts)
    .filter(([, count]) => count >= 10)
    .map(([uid, count]) => ({ userId: uid, pendingCount: count }))
    .sort((a, b) => b.pendingCount - a.pendingCount);

  return NextResponse.json({
    totalPending: totalPending ?? 0,
    overdueCount: overdueCount ?? 0,
    overdueItems: (overdueData ?? []).map((r) => ({
      resultId: r.id,
      userId: r.app_user_id,
      createdAt: r.created_at,
      hoursAgo: Math.floor((Date.now() - new Date(r.created_at).getTime()) / 3600000),
    })),
    suspicious,
  });
}
