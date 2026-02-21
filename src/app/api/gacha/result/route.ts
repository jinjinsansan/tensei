import { NextResponse } from 'next/server';

import { getServiceSupabase } from '@/lib/supabase/service';
import {
  fetchCardById,
  fetchGachaResultById,
  setGachaHistoryStatus,
  ensureGachaResultAwarded,
} from '@/lib/data/gacha';
import { fetchAuthedContext } from '@/lib/app/session';
import { buildCollectionEntryFromInventory } from '@/lib/collection/supabase';
import type { StoryPayload } from '@/lib/gacha/types';
import type { GachaResult } from '@/lib/gacha/common/types';
import type { Tables } from '@/types/database';
import { buildCommonAssetPath } from '@/lib/gacha/assets';
import { mapCardDbIdToModuleId, mapCharacterDbIdToModuleId } from '@/lib/gacha/characters/mapping';
import { emitCollectionEventToEdge } from '@/lib/cloudflare/collection-cache';

type ResultRequest = {
  resultId: string;
};

export async function POST(request: Request) {
  const supabase = getServiceSupabase();
  let historyId: string | null = null;
  try {
    const body = await request.json();
    validateBody(body);

    const context = await fetchAuthedContext(supabase);
    if (!context) {
      return NextResponse.json({ success: false, error: 'ログインが必要です。' }, { status: 401 });
    }
    const { session, user } = context;

    let resultRow = await fetchGachaResultById(supabase, body.resultId);
    // app_user_id で本人確認（セッションは再ログイン等で変わるため user_session_id だけで弾かない）
    if (resultRow.app_user_id !== user.id) {
      return NextResponse.json({ success: false, error: '対象データへのアクセス権がありません。' }, { status: 403 });
    }

    const cardId = resultRow.card_id;
    if (!cardId) {
      throw new Error('カード情報が見つかりません。');
    }

    const card = await fetchCardById(supabase, cardId);

    historyId = resultRow.history_id ?? null;

    const awardOutcome = await ensureGachaResultAwarded(supabase, {
      resultRow,
      card,
      appUserId: user.id,
      userSessionId: session.id,
    });
    resultRow = awardOutcome.resultRow;

    const serialNumber = awardOutcome.serialNumber;
    const inventoryId = awardOutcome.inventoryRow?.id ?? null;

    if (awardOutcome.didAward && awardOutcome.inventoryRow) {
      const entry = buildCollectionEntryFromInventory(awardOutcome.inventoryRow, awardOutcome.card);
      void emitCollectionEventToEdge(user.id, {
        type: 'add',
        entry,
        totalOwnedDelta: 1,
        distinctOwnedDelta: awardOutcome.alreadyOwnedBeforeAward ? 0 : 1,
      });
    }

    await setGachaHistoryStatus(supabase, historyId, 'success');

    const story = resultRow.scenario_snapshot as StoryPayload;
    const storedGachaResult = (resultRow.metadata as { gachaResult?: GachaResult } | null)?.gachaResult;
    const gachaResult = storedGachaResult ?? createFallbackGachaResult(resultRow, card);

    return NextResponse.json({
      success: true,
      resultId: resultRow.id,
      serialNumber,
      inventoryId,
      gachaResult,
      card: {
        id: card.id,
        name: card.card_name,
        rarity: card.rarity,
        starLevel: card.star_level,
        imageUrl: card.card_image_url,
        hasReversal: card.has_reversal,
        serialNumber,
      },
      starLevel: resultRow.star_level,
      hadReversal: resultRow.had_reversal,
      story,
    });
  } catch (error) {
    console.error('gacha/result error', error);
    const message = error instanceof Error ? error.message : '結果の確定に失敗しました。';
    if (historyId) {
      try {
        await setGachaHistoryStatus(supabase, historyId, 'error', message.slice(0, 500));
      } catch (statusError) {
        console.error('Failed to update gacha history status', statusError);
      }
    }
    const status = error instanceof Error && error.message.includes('ログイン') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

function validateBody(body: unknown): asserts body is ResultRequest {
  if (!body || typeof body !== 'object' || typeof (body as ResultRequest).resultId !== 'string') {
    throw new Error('resultId が必要です。');
  }
}

function createFallbackGachaResult(
  resultRow: Tables<'gacha_results'>,
  card: Tables<'cards'>,
): GachaResult {
  const characterModuleId = mapCharacterDbIdToModuleId(resultRow.character_id);
  const cardModuleId = mapCardDbIdToModuleId(card.id);
  return {
    isLoss: false,
    characterId: (characterModuleId as GachaResult['characterId']) ?? 'kenta',
    cardId: cardModuleId ?? card.id,
    rarity: (card.rarity as GachaResult['rarity']) ?? 'N',
    starRating: card.star_level ?? resultRow.star_level ?? 1,
    cardName: card.card_name,
    cardTitle: card.description ?? card.card_name,
    cardImagePath: card.card_image_url ?? '',
    lossCardImagePath: buildCommonAssetPath('loss_card.png'),
    isDonden: Boolean(resultRow.had_reversal),
    dondenFromCardId: undefined,
    dondenFromRarity: undefined,
    isSequel: false,
  };
}
