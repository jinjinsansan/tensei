import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';

import type { Database, Tables, TablesInsert } from '@/types/database';
import { parseGachaConfig, type ParsedGachaConfig } from '@/lib/gacha/config';
import type { Rarity } from '@/lib/gacha/common/types';

type DbClient = SupabaseClient<Database>;

function handleError(error: PostgrestError | null) {
  if (error) {
    throw error;
  }
}

export async function fetchGachaConfig(client: DbClient, slug = 'default'): Promise<ParsedGachaConfig> {
  const { data, error } = await client
    .from('gacha_config')
    .select('*')
    .eq('slug', slug)
    .limit(1)
    .single();
  handleError(error);
  if (!data) throw new Error('Missing gacha_config row');
  return parseGachaConfig(data as Tables<'gacha_config'>);
}

// v2: 共通ハズレ率（gacha_global_config）
export async function fetchGachaGlobalConfig(client: DbClient): Promise<{ lossRate: number }> {
  const { data, error } = await client.from('gacha_global_config').select('*').limit(1).single();
  handleError(error);
  if (!data) {
    return { lossRate: 60 };
  }
  const row = data as Tables<'gacha_global_config'>;
  return { lossRate: Number(row.loss_rate ?? 60) };
}

export type GachaCharacterConfig = {
  characterId: string; // 'kenta' | 'shoichi' ...
  characterName: string;
  isActive: boolean;
  weight: number;
};

// v2: キャラクター出現率設定（gacha_characters）
export async function fetchGachaCharactersConfig(client: DbClient): Promise<GachaCharacterConfig[]> {
  const { data, error } = await client
    .from('gacha_characters')
    .select('*')
    .order('created_at', { ascending: true });
  handleError(error);
  const rows = (data ?? []) as Tables<'gacha_characters'>[];
  return rows.map((row) => ({
    characterId: row.character_id,
    characterName: row.character_name,
    isActive: row.is_active,
    weight: Number(row.weight ?? 0),
  }));
}

export type CharacterRtpConfig = {
  characterId: string;
  lossRate: number; // 0-100
  rarityDistribution: Record<Rarity, number>;
  dondenRate: number; // 0-100
};

// v2: キャラ別RTP設定（gacha_rtp_config）
export async function fetchCharacterRtpConfig(
  client: DbClient,
  characterId: string,
): Promise<CharacterRtpConfig> {
  const { data, error } = await client
    .from('gacha_rtp_config')
    .select('*')
    .eq('character_id', characterId)
    .limit(1)
    .single();
  handleError(error);

  if (!data) {
    // フォールバック: 仕様書のデフォルト値
    return {
      characterId,
      lossRate: 60,
      rarityDistribution: {
        N: 35,
        R: 25,
        SR: 20,
        SSR: 12,
        UR: 6,
        LR: 2,
      },
      dondenRate: 15,
    };
  }

  const row = data as Tables<'gacha_rtp_config'>;
  const rarityDistribution: Record<Rarity, number> = {
    N: Number(row.rarity_n ?? 0),
    R: Number(row.rarity_r ?? 0),
    SR: Number(row.rarity_sr ?? 0),
    SSR: Number(row.rarity_ssr ?? 0),
    UR: Number(row.rarity_ur ?? 0),
    LR: Number(row.rarity_lr ?? 0),
  };

  return {
    characterId: row.character_id,
    lossRate: Number(row.loss_rate ?? 60),
    rarityDistribution,
    dondenRate: Number(row.donden_rate ?? 15),
  };
}

export type GachaSummaryStats = {
  totalPlays: number;
  reversalCount: number;
  lastPlay: string | null;
  averageStar: number;
};

type SummaryRow = {
  total_plays: number | null;
  reversal_count: number | null;
  last_play: string | null;
  average_star: number | null;
};

export async function fetchGachaSummaryStats(client: DbClient): Promise<GachaSummaryStats> {
  const { data, error } = await client.rpc('get_gacha_summary_stats');
  handleError(error);
  const rows = (data ?? []) as SummaryRow[];
  const row = rows.length > 0 ? rows[0] : null;
  return {
    totalPlays: Number(row?.total_plays ?? 0),
    reversalCount: Number(row?.reversal_count ?? 0),
    lastPlay: row?.last_play ?? null,
    averageStar: row?.average_star ? Number(row.average_star) : 0,
  };
}

export type GachaStarCount = {
  starLevel: number;
  total: number;
};

type StarCountRow = {
  star_level: number | null;
  total: number | null;
};

export async function fetchGachaStarCounts(client: DbClient): Promise<GachaStarCount[]> {
  const { data, error } = await client.rpc('get_gacha_star_counts');
  handleError(error);
  return ((data ?? []) as StarCountRow[]).map((row) => ({
    starLevel: Number(row.star_level ?? 0),
    total: Number(row.total ?? 0),
  }));
}

export type GachaCardLeaderboardEntry = {
  cardId: string;
  cardName: string;
  rarity: string;
  starLevel: number;
  total: number;
};

type LeaderboardRow = {
  card_id: string;
  card_name: string | null;
  rarity: string | null;
  star_level: number | null;
  total: number | null;
};

export async function fetchGachaCardLeaderboard(
  client: DbClient,
  limit = 5,
): Promise<GachaCardLeaderboardEntry[]> {
  const { data, error } = await client.rpc('get_gacha_card_leaderboard', { limit_count: limit } as never);
  handleError(error);
  return ((data ?? []) as LeaderboardRow[]).map((row) => ({
    cardId: String(row.card_id),
    cardName: String(row.card_name ?? '---'),
    rarity: String(row.rarity ?? 'N'),
    starLevel: Number(row.star_level ?? 0),
    total: Number(row.total ?? 0),
  }));
}

export async function fetchActiveCharacters(client: DbClient): Promise<Tables<'characters'>[]> {
  const { data, error } = await client
    .from('characters')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  handleError(error);
  return (data ?? []) as Tables<'characters'>[];
}

export async function fetchAllCharacters(client: DbClient): Promise<Tables<'characters'>[]> {
  const { data, error } = await client
    .from('characters')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  handleError(error);
  return (data ?? []) as Tables<'characters'>[];
}

export async function fetchCardsByCharacter(
  client: DbClient,
  characterId: string,
): Promise<Tables<'cards'>[]> {
  const { data, error } = await client
    .from('cards')
    .select('*')
    .eq('character_id', characterId)
    .eq('is_active', true)
    .order('star_level')
    .order('sort_order');
  handleError(error);
  return (data ?? []) as Tables<'cards'>[];
}

export async function fetchAllCards(client: DbClient): Promise<Tables<'cards'>[]> {
  const { data, error } = await client
    .from('cards')
    .select('*')
    .order('star_level')
    .order('sort_order');
  handleError(error);
  return (data ?? []) as Tables<'cards'>[];
}

export async function fetchCardById(
  client: DbClient,
  cardId: string,
): Promise<Tables<'cards'>> {
  const { data, error } = await client.from('cards').select('*').eq('id', cardId).single();
  handleError(error);
  if (!data) throw new Error('Card not found');
  return data as Tables<'cards'>;
}

export async function fetchPreStories(
  client: DbClient,
  characterId: string,
): Promise<Tables<'pre_stories'>[]> {
  const { data, error } = await client
    .from('pre_stories')
    .select('*')
    .eq('character_id', characterId)
    .order('pattern')
    .order('scene_order');
  handleError(error);
  return (data ?? []) as Tables<'pre_stories'>[];
}

export async function fetchChanceScenes(
  client: DbClient,
  characterId: string,
): Promise<Tables<'chance_scenes'>[]> {
  const { data, error } = await client
    .from('chance_scenes')
    .select('*')
    .eq('character_id', characterId)
    .order('pattern');
  handleError(error);
  return (data ?? []) as Tables<'chance_scenes'>[];
}

export async function fetchScenarios(
  client: DbClient,
  cardId: string,
): Promise<Tables<'scenarios'>[]> {
  const { data, error } = await client
    .from('scenarios')
    .select('*')
    .eq('card_id', cardId)
    .order('phase')
    .order('scene_order');
  handleError(error);
  return (data ?? []) as Tables<'scenarios'>[];
}

export async function fetchAllScenarios(client: DbClient): Promise<Tables<'scenarios'>[]> {
  const { data, error } = await client
    .from('scenarios')
    .select('*')
    .order('card_id')
    .order('phase')
    .order('scene_order');
  handleError(error);
  return (data ?? []) as Tables<'scenarios'>[];
}

export async function insertGachaHistory(
  client: DbClient,
  payload: TablesInsert<'gacha_history'>,
): Promise<Tables<'gacha_history'>> {
  const { data, error } = await client
    .from('gacha_history')
    .insert(payload)
    .select('*')
    .single();
  handleError(error);
  if (!data) throw new Error('Failed to record gacha history');
  return data as Tables<'gacha_history'>;
}

export async function insertGachaResult(
  client: DbClient,
  payload: TablesInsert<'gacha_results'>,
): Promise<Tables<'gacha_results'>> {
  const { data, error } = await client
    .from('gacha_results')
    .insert(payload)
    .select('*')
    .single();
  handleError(error);
  if (!data) throw new Error('Failed to create gacha result');
  return data as Tables<'gacha_results'>;
}

export async function fetchGachaResultById(
  client: DbClient,
  resultId: string,
): Promise<Tables<'gacha_results'>> {
  const { data, error } = await client.from('gacha_results').select('*').eq('id', resultId).single();
  handleError(error);
  if (!data) throw new Error('Result not found');
  return data as Tables<'gacha_results'>;
}

export async function completeGachaResult(
  client: DbClient,
  resultId: string,
): Promise<Tables<'gacha_results'>> {
  const { data, error } = await client
    .from('gacha_results')
    .update({ card_awarded: true, completed_at: new Date().toISOString() })
    .eq('id', resultId)
    .select('*')
    .single();
  handleError(error);
  if (!data) throw new Error('Result update failed');
  return data as Tables<'gacha_results'>;
}

export async function upsertCardCollection(
  client: DbClient,
  payload: TablesInsert<'card_collection'>,
): Promise<Tables<'card_collection'>> {
  if (!payload.app_user_id) {
    throw new Error('app_user_id is required when updating card collection');
  }
  const { data, error } = await client
    .from('card_collection')
    .upsert(payload, { onConflict: 'app_user_id,card_id' })
    .select('*')
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (data) {
    return data as Tables<'card_collection'>;
  }

  const { data: existing, error: fetchError } = await client
    .from('card_collection')
    .select('*')
    .eq('app_user_id', payload.app_user_id)
    .eq('card_id', payload.card_id)
    .single();
  handleError(fetchError);
  if (!existing) throw new Error('Failed to upsert card collection');
  return existing as Tables<'card_collection'>;
}

export async function fetchCardCollection(
  client: DbClient,
  userId: string,
): Promise<Tables<'card_collection'>[]> {
  const { data, error } = await client
    .from('card_collection')
    .select('*')
    .eq('app_user_id', userId);
  handleError(error);
  return (data ?? []) as Tables<'card_collection'>[];
}

export async function insertCardInventoryEntry(
  client: DbClient,
  payload: TablesInsert<'card_inventory'>,
): Promise<Tables<'card_inventory'>> {
  const { data, error } = await client
    .from('card_inventory')
    .insert(payload)
    .select('*')
    .single();
  handleError(error);
  if (!data) throw new Error('カードの登録に失敗しました。');
  return data as Tables<'card_inventory'>;
}
