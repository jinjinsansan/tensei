import { NextResponse } from 'next/server';

import { getServiceSupabase } from '@/lib/supabase/service';
import { consumeTicket } from '@/lib/data/tickets';
import { generateBattleGachaBatchPlay } from '@/lib/gacha/battle/engine';
import { fetchAuthedContext } from '@/lib/app/session';

const ALLOW_GUEST_GACHA = process.env.GACHA_ALLOW_GUEST !== 'false';
const TENFOLD_PULLS = 10;

export async function POST(request: Request) {
  try {
    void request;
    const supabase = getServiceSupabase();
    const context = await fetchAuthedContext(supabase);

    if (!context) {
      if (!ALLOW_GUEST_GACHA) {
        return NextResponse.json({ success: false, error: 'ログインが必要です。' }, { status: 401 });
      }
      return NextResponse.json(
        { success: false, error: 'ゲストモードはバトルガチャに対応していません。' },
        { status: 401 },
      );
    }

    const { session, user } = context;
    const isAdmin = user.is_admin === true;

    let remaining: number | null = null;
    if (!isAdmin) {
      const result = await consumeTicket(supabase, user.id, {});
      remaining = result.remaining;
    }

    const batch = await generateBattleGachaBatchPlay({
      sessionId: session.id,
      appUserId: user.id,
      drawCount: TENFOLD_PULLS,
    });

    return NextResponse.json({
      success: true,
      ticketBalance: remaining,
      session: {
        multiSessionId: batch.multiSession?.id ?? null,
        totalPulls: batch.pulls.length,
      },
      pulls: batch.pulls.map((pull, index) => ({
        order: index + 1,
        resultId: pull.resultRow?.id ?? null,
        gachaResult: pull.gachaResult,
        opponentCharacterId: pull.opponentCharacterId,
      })),
    });
  } catch (error) {
    console.error('battle-gacha/play error', error);
    const message = error instanceof Error ? error.message : 'バトルガチャの生成に失敗しました。';
    const status = message.includes('チケット') || message.includes('準備中') ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
