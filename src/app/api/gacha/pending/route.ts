import { NextResponse } from 'next/server';

import { fetchAuthedContext } from '@/lib/app/session';
import { getServiceSupabase } from '@/lib/supabase/service';
import type { GachaResult } from '@/lib/gacha/common/types';
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
    const story = row.scenario_snapshot as StoryPayload | null;
    return {
      order: index + 1,
      resultId: row.id,
      createdAt: row.created_at,
      gachaResult: storedGachaResult,
      story,
      card: row.cards
        ? {
            id: (row.cards as { id: string }).id,
            name: (row.cards as { card_name: string }).card_name,
            rarity: (row.cards as { rarity: string }).rarity,
            starLevel: (row.cards as { star_level: number | null }).star_level,
            imageUrl: (row.cards as { card_image_url: string | null }).card_image_url,
            hasReversal: (row.cards as { has_reversal: boolean }).has_reversal,
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
