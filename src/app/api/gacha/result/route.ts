import { NextResponse } from 'next/server';

import { getServiceSupabase } from '@/lib/supabase/service';
import { findSessionByToken } from '@/lib/data/session';
import {
  completeGachaResult,
  fetchCardById,
  fetchGachaResultById,
  upsertCardCollection,
} from '@/lib/data/gacha';
import { getSessionToken } from '@/lib/session/cookie';
import type { StoryPayload } from '@/lib/gacha/types';

type ResultRequest = {
  resultId: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    validateBody(body);

    const sessionToken = await getSessionToken();
    if (!sessionToken) {
      return NextResponse.json({ success: false, error: 'セッションが見つかりません。' }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    const session = await findSessionByToken(supabase, sessionToken);
    if (!session) {
      return NextResponse.json({ success: false, error: 'セッションが有効ではありません。' }, { status: 401 });
    }

    let resultRow = await fetchGachaResultById(supabase, body.resultId);
    if (resultRow.user_session_id !== session.id) {
      return NextResponse.json({ success: false, error: '対象データへのアクセス権がありません。' }, { status: 403 });
    }

    const cardId = resultRow.card_id;
    if (!cardId) {
      throw new Error('カード情報が見つかりません。');
    }

    if (!resultRow.card_awarded) {
      await upsertCardCollection(supabase, {
        user_session_id: session.id,
        card_id: cardId,
        gacha_result_id: resultRow.id,
      });
      resultRow = await completeGachaResult(supabase, resultRow.id);
    }

    const card = await fetchCardById(supabase, cardId);
    const story = resultRow.scenario_snapshot as StoryPayload;

    return NextResponse.json({
      success: true,
      resultId: resultRow.id,
      card: {
        id: card.id,
        name: card.card_name,
        rarity: card.rarity,
        starLevel: card.star_level,
        imageUrl: card.card_image_url,
        hasReversal: card.has_reversal,
      },
      starLevel: resultRow.star_level,
      hadReversal: resultRow.had_reversal,
      story,
    });
  } catch (error) {
    console.error('gacha/result error', error);
    const message = error instanceof Error ? error.message : '結果の確定に失敗しました。';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

function validateBody(body: unknown): asserts body is ResultRequest {
  if (!body || typeof body !== 'object' || typeof (body as ResultRequest).resultId !== 'string') {
    throw new Error('resultId が必要です。');
  }
}
