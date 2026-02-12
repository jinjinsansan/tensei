import { NextResponse } from 'next/server';

import { getServiceSupabase } from '@/lib/supabase/service';
import { getOrCreateSession } from '@/lib/data/session';
import { consumeTicket } from '@/lib/data/tickets';
import { getOrCreateSessionToken } from '@/lib/session/cookie';
import { generateGachaPlay } from '@/lib/gacha/engine';

const INITIAL_TICKETS = 30;

type PlayRequest = {
  configSlug?: string;
};

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const token = await getOrCreateSessionToken();
    const supabase = getServiceSupabase();
    const sessionRow = await getOrCreateSession(supabase, token, { initialTickets: INITIAL_TICKETS });
    const { session, remaining } = await consumeTicket(supabase, sessionRow, {
      initialTickets: INITIAL_TICKETS,
    });

    const gacha = await generateGachaPlay({
      sessionId: session.id,
      configSlug: body?.configSlug,
    });

    return NextResponse.json({
      success: true,
      resultId: gacha.resultRow.id,
      starLevel: gacha.story.starLevel,
      hadReversal: gacha.story.hadReversal,
      ticketBalance: remaining,
      character: {
        id: gacha.character.id,
        name: gacha.character.name,
        thumbnailUrl: gacha.character.thumbnail_url,
        expectationLevel: gacha.character.expectation_level,
      },
      card: {
        id: gacha.card.id,
        name: gacha.card.card_name,
        rarity: gacha.card.rarity,
        starLevel: gacha.card.star_level,
        imageUrl: gacha.card.card_image_url,
        hasReversal: gacha.card.has_reversal,
      },
      story: gacha.story,
    });
  } catch (error) {
    console.error('gacha/play error', error);
    const message = error instanceof Error ? error.message : 'ガチャの生成に失敗しました。';
    const status = message.includes('栞') ? 400 : 500;
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
