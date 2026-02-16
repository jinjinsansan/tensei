import { NextResponse } from 'next/server';

import { getServiceSupabase } from '@/lib/supabase/service';
import {
  completeGachaResult,
  fetchCardById,
  fetchGachaResultById,
  upsertCardCollection,
  insertCardInventoryEntry,
} from '@/lib/data/gacha';
import { fetchAuthedContext } from '@/lib/app/session';
import type { StoryPayload } from '@/lib/gacha/types';
import type { GachaResult } from '@/lib/gacha/common/types';
import type { Tables } from '@/types/database';
import { buildCommonAssetPath } from '@/lib/gacha/assets';
import { mapCardDbIdToModuleId, mapCharacterDbIdToModuleId } from '@/lib/gacha/characters/mapping';

type ResultRequest = {
  resultId: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    validateBody(body);

    const supabase = getServiceSupabase();
    const context = await fetchAuthedContext(supabase);
    if (!context) {
      return NextResponse.json({ success: false, error: 'ログインが必要です。' }, { status: 401 });
    }
    const { session, user } = context;

    let resultRow = await fetchGachaResultById(supabase, body.resultId);
    if (resultRow.user_session_id !== session.id || resultRow.app_user_id !== user.id) {
      return NextResponse.json({ success: false, error: '対象データへのアクセス権がありません。' }, { status: 403 });
    }

    const cardId = resultRow.card_id;
    if (!cardId) {
      throw new Error('カード情報が見つかりません。');
    }

    let serialNumber: number | null = null;
    let inventoryId: string | null = null;

    if (!resultRow.card_awarded) {
      const { data: serialData, error: serialError } = await supabase
        .rpc('next_card_serial', { target_card_id: cardId });
      if (serialError || typeof serialData !== 'number') {
        throw serialError ?? new Error('シリアル番号の取得に失敗しました。');
      }
      const inventoryRow = await insertCardInventoryEntry(supabase, {
        app_user_id: user.id,
        card_id: cardId,
        serial_number: serialData,
        obtained_via: resultRow.obtained_via ?? 'single_gacha',
        gacha_result_id: resultRow.id,
      });
      serialNumber = serialData;
      inventoryId = inventoryRow.id;
      await upsertCardCollection(supabase, {
        user_session_id: session.id,
        app_user_id: user.id,
        card_id: cardId,
        gacha_result_id: resultRow.id,
      });
      resultRow = await completeGachaResult(supabase, resultRow.id);
    } else {
      const { data: inventoryRow } = await supabase
        .from('card_inventory')
        .select('id, serial_number')
        .eq('gacha_result_id', resultRow.id)
        .eq('app_user_id', user.id)
        .maybeSingle();
      if (inventoryRow) {
        serialNumber = typeof inventoryRow.serial_number === 'number' ? inventoryRow.serial_number : null;
        inventoryId = inventoryRow.id as string;
      }
    }

    const card = await fetchCardById(supabase, cardId);
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
