import { NextResponse } from 'next/server';

import { getServiceSupabase } from '@/lib/supabase/service';
import { consumeTicket } from '@/lib/data/tickets';
import { generateGachaBatchPlay, generateGuestGachaBatchPlay } from '@/lib/gacha/engine';
import type { GachaEngineResult } from '@/lib/gacha/types';
import { fetchAuthedContext } from '@/lib/app/session';

type PlayRequest = {
  configSlug?: string;
  ticketCode?: string;
};

const ALLOW_GUEST_GACHA = process.env.GACHA_ALLOW_GUEST !== 'false';
const TENFOLD_PULLS = 10;

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const supabase = getServiceSupabase();
    const context = await fetchAuthedContext(supabase);

    if (!context) {
      if (!ALLOW_GUEST_GACHA) {
        return NextResponse.json({ success: false, error: 'ログインが必要です。' }, { status: 401 });
      }
      const pulls = await generateGuestGachaBatchPlay({ configSlug: body?.configSlug, drawCount: TENFOLD_PULLS });
      return NextResponse.json({
        success: true,
        ticketBalance: null,
        session: {
          multiSessionId: null,
          totalPulls: pulls.length,
        },
        pulls: pulls.map((pull, index) => serializePull(pull, index + 1)),
      });
    }

    const { session, user } = context;
    const isAdmin = user.is_admin === true;

    let remaining: number | null = null;
    if (!isAdmin) {
      const result = await consumeTicket(supabase, user.id, { ticketCode: body?.ticketCode });
      remaining = result.remaining;
    }

    const batch = await generateGachaBatchPlay({
      sessionId: session.id,
      appUserId: user.id,
      configSlug: body?.configSlug,
      drawCount: TENFOLD_PULLS,
    });

    return NextResponse.json({
      success: true,
      ticketBalance: remaining,
      session: {
        multiSessionId: batch.multiSession?.id ?? null,
        totalPulls: batch.pulls.length,
      },
      pulls: batch.pulls.map((pull, index) => serializePull(pull, index + 1)),
    });
  } catch (error) {
    console.error('gacha/play error', error);
    const message = error instanceof Error ? error.message : 'ガチャの生成に失敗しました。';
    const status = message.includes('チケット') ? 400 : 500;
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status },
    );
  }
}

async function readJsonBody(request: Request): Promise<PlayRequest | null> {
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return null;
  }
  try {
    return (await request.json()) as PlayRequest;
  } catch (error) {
    console.warn('Failed to parse gacha/play body', error);
    return null;
  }
}

function serializePull(pull: GachaEngineResult, order: number) {
  return {
    order,
    resultId: pull.resultRow?.id ?? null,
    gachaResult: pull.gachaResult,
    story: pull.story,
    character: {
      id: pull.character.id,
      name: pull.character.name,
      thumbnailUrl: pull.character.thumbnail_url,
      expectationLevel: pull.character.expectation_level,
    },
    card: {
      id: pull.card.id,
      name: pull.card.card_name,
      rarity: pull.card.rarity,
      starLevel: pull.card.star_level,
      imageUrl: pull.card.card_image_url,
      hasReversal: pull.card.has_reversal,
    },
  };
}
