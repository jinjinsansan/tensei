import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';

import type { Database, Tables, TablesInsert } from '@/types/database';
import { parseGachaConfig, type ParsedGachaConfig } from '@/lib/gacha/config';

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
  const { data, error } = await client
    .from('card_collection')
    .upsert(payload, { onConflict: 'user_session_id,card_id' })
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
    .eq('user_session_id', payload.user_session_id)
    .eq('card_id', payload.card_id)
    .single();
  handleError(fetchError);
  if (!existing) throw new Error('Failed to upsert card collection');
  return existing as Tables<'card_collection'>;
}

export async function fetchCardCollection(
  client: DbClient,
  sessionId: string,
): Promise<Tables<'card_collection'>[]> {
  const { data, error } = await client
    .from('card_collection')
    .select('*')
    .eq('user_session_id', sessionId);
  handleError(error);
  return (data ?? []) as Tables<'card_collection'>[];
}
