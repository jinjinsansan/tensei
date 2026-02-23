import { NextResponse } from 'next/server';

import { fetchAuthedContext } from '@/lib/app/session';
import { getServiceSupabase } from '@/lib/supabase/service';
import type { GachaResult, Rarity } from '@/lib/gacha/common/types';
import type { StoryPayload } from '@/lib/gacha/types';

// 未完了（card_awarded=false）の gacha_results を返す
// ガチャページ復帰時の再開に使用
export async function GET() {
  const supabase = getServiceSupabase();
  const context = await fetchAuthedContext(supabase).catch(() => null);
  if (!context) {
    return NextResponse.json({ success: false, error: 'ログインが必要です' }, { status: 401 });
  }

  const { user } = context;

  // 直近24時間以内の未付与結果のみ対象（古いものは自動バッチが処理）
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('gacha_results')
    .select(
      `id, created_at, card_awarded, metadata, scenario_snapshot, star_level, had_reversal, obtained_via,
       cards:card_id (id, card_name, rarity, star_level, card_image_url, has_reversal),
       characters:character_id (id, name)`,
    )
    .eq('app_user_id', user.id)
    .eq('card_awarded', false)
    .gte('created_at', cutoff)
    .order('created_at', { ascending: true })
    .limit(10);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  if (rows.length === 0) {
    return NextResponse.json({ success: true, hasPending: false, pulls: [] });
  }

  // フロントエンドが使える形式にシリアライズ
  const pulls = rows.map((row, index) => {
    const storedGachaResult = (row.metadata as { gachaResult?: GachaResult } | null)?.gachaResult ?? null;
    const card = row.cards as
      | {
          id: string;
          card_name: string;
          rarity: string;
          star_level: number | null;
          card_image_url: string | null;
          has_reversal: boolean;
        }
      | null;

    const character = row.characters as { id: string } | null;

    // メタデータが欠けていてもカード情報から最低限の gachaResult を復元
    const fallbackGachaResult: GachaResult | null = card
      ? {
          isLoss: false,
          characterId: (character?.id as GachaResult['characterId']) ?? 'kenta',
          cardId: card.id,
          rarity: card.rarity as Rarity,
          starRating: card.star_level ?? 0,
          cardName: card.card_name,
          cardTitle: card.card_name,
          cardImagePath: card.card_image_url ?? '/placeholders/card-default.svg',
          lossCardImagePath: undefined,
          isDonden: card.has_reversal,
          dondenFromCardId: undefined,
          dondenFromRarity: undefined,
          isSequel: false,
        }
      : null;

    const story = row.scenario_snapshot as StoryPayload | null;
    return {
      order: index + 1,
      resultId: row.id,
      createdAt: row.created_at,
      gachaResult: storedGachaResult ?? fallbackGachaResult,
      story,
      card: card
        ? {
            id: card.id,
            name: card.card_name,
            rarity: card.rarity,
            starLevel: card.star_level,
            imageUrl: card.card_image_url,
            hasReversal: card.has_reversal,
          }
        : null,
    };
  });

  return NextResponse.json({
    success: true,
    hasPending: true,
    pulls,
    sessionCreatedAt: rows[0]?.created_at ?? null,
  });
}
