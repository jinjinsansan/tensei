import { NextResponse } from 'next/server';

import { getServiceSupabase } from '@/lib/supabase/service';
import { consumeTicket } from '@/lib/data/tickets';
import { generateGachaPlay } from '@/lib/gacha/engine';
import { fetchAuthedContext } from '@/lib/app/session';

type PlayRequest = {
  configSlug?: string;
  ticketCode?: string;
};

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const supabase = getServiceSupabase();
    const context = await fetchAuthedContext(supabase);
    if (!context) {
      return NextResponse.json({ success: false, error: 'ログインが必要です。' }, { status: 401 });
    }
    const { session, user } = context;
    const { remaining } = await consumeTicket(supabase, user.id, { ticketCode: body?.ticketCode });

    const gacha = await generateGachaPlay({
      sessionId: session.id,
      appUserId: user.id,
      configSlug: body?.configSlug,
    });

    return NextResponse.json({
      success: true,
      resultId: gacha.resultRow.id,
      ticketBalance: remaining,
      gachaResult: gacha.gachaResult,
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
