import { NextResponse } from 'next/server';

import { fetchAuthedContext } from '@/lib/app/session';
import { getServiceSupabase } from '@/lib/supabase/service';
import {
  fetchGachaResultById,
  fetchCardById,
  ensureGachaResultAwarded,
  setGachaHistoryStatus,
} from '@/lib/data/gacha';
import { buildCollectionEntryFromInventory } from '@/lib/collection/supabase';
import { emitCollectionEventToEdge } from '@/lib/cloudflare/collection-cache';

type RequestBody = {
  resultId: string;
};

// Admin: 特定の gacha_result を強制付与する
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

  const { resultId } = body;
  if (!resultId || typeof resultId !== 'string') {
    return NextResponse.json({ error: 'resultId is required' }, { status: 400 });
  }

  try {
    const resultRow = await fetchGachaResultById(supabase, resultId);

    if (resultRow.card_awarded) {
      return NextResponse.json({ success: true, message: '既に付与済みです', alreadyAwarded: true });
    }

    const cardId = resultRow.card_id;
    if (!cardId) {
      return NextResponse.json({ error: 'カード情報が見つかりません' }, { status: 400 });
    }

    const card = await fetchCardById(supabase, cardId);
    const appUserId = resultRow.app_user_id;
    const userSessionId = resultRow.user_session_id;

    if (!appUserId) {
      return NextResponse.json({ error: 'ユーザー情報が見つかりません' }, { status: 400 });
    }

    const awardOutcome = await ensureGachaResultAwarded(supabase, {
      resultRow,
      card,
      appUserId,
      userSessionId,
    });

    if (awardOutcome.didAward && awardOutcome.inventoryRow) {
      const entry = buildCollectionEntryFromInventory(awardOutcome.inventoryRow, awardOutcome.card);
      void emitCollectionEventToEdge(appUserId, {
        type: 'add',
        entry,
        totalOwnedDelta: 1,
        distinctOwnedDelta: awardOutcome.alreadyOwnedBeforeAward ? 0 : 1,
      });
    }

    await setGachaHistoryStatus(supabase, resultRow.history_id, 'success');

    return NextResponse.json({
      success: true,
      message: '強制付与完了',
      serialNumber: awardOutcome.serialNumber,
      alreadyAwarded: false,
    });
  } catch (error) {
    console.error('force-award error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '強制付与に失敗しました' },
      { status: 500 },
    );
  }
}
