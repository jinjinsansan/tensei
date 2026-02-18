import type { SupabaseClient } from '@supabase/supabase-js';

import type { CollectionResponse, CollectionEntry } from '@/lib/collection/types';
import type { Database, Tables } from '@/types/database';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

type FetchOptions = {
  limit?: number | null;
  offset?: number | null;
};

type DbClient = SupabaseClient<Database>;

export async function fetchCollectionPageData(
  client: DbClient,
  userId: string,
  options?: FetchOptions,
): Promise<CollectionResponse> {
  const limit = clampLimit(options?.limit ?? DEFAULT_LIMIT);
  const offset = clampOffset(options?.offset ?? 0);

  const [inventoryResult, distinctResult, cardsResult] = await Promise.all([
    client
      .from('card_inventory')
      .select(
        `id, card_id, serial_number, obtained_at,
         cards:card_inventory_card_id_fkey (
           id,
           card_name,
           rarity,
           star_level,
           description,
           card_image_url,
           max_supply,
           current_supply,
           person_name,
           card_style,
           is_loss_card
         )`,
        { count: 'exact' },
      )
      .eq('app_user_id', userId)
      .order('obtained_at', { ascending: false })
      .range(offset, offset + limit - 1),
    client
      .from('card_collection')
      .select('id', { count: 'exact', head: true })
      .eq('app_user_id', userId),
    client
      .from('cards')
      .select('id, card_name, rarity, card_image_url', { count: 'exact' })
      .eq('is_active', true)
      .order('rarity', { ascending: false }),
  ]);

  if (inventoryResult.error) {
    throw new Error(inventoryResult.error.message);
  }
  if (distinctResult.error) {
    throw new Error(distinctResult.error.message);
  }
  if (cardsResult.error) {
    throw new Error(cardsResult.error.message);
  }

  const rawCollection = (inventoryResult.data ?? []) as InventoryRow[];
  const collection = rawCollection.map(mapInventoryRowToEntry);
  const totalOwned = inventoryResult.count ?? rawCollection.length;
  const distinctOwned = distinctResult.count ?? 0;
  const cards = (cardsResult.data ?? []).map((card) => ({
    id: card.id,
    name: card.card_name,
    rarity: card.rarity,
    image_url: card.card_image_url,
  }));
  const totalAvailable = cardsResult.count ?? cards.length;

  return {
    totalOwned,
    distinctOwned,
    totalAvailable,
    cards,
    collection,
    page: {
      limit,
      offset,
      hasMore: totalOwned > offset + collection.length,
    },
  };
}

function clampLimit(raw: number) {
  if (!Number.isFinite(raw)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.floor(raw), 1), MAX_LIMIT);
}

function clampOffset(raw: number) {
  if (!Number.isFinite(raw)) return 0;
  return Math.max(Math.floor(raw), 0);
}

type InventoryRow = Tables<'card_inventory'> & {
  cards: {
    id: string;
    card_name: string;
    rarity: string;
    star_level: number | null;
    description: string | null;
    card_image_url: string | null;
    max_supply: number | null;
    current_supply: number | null;
    person_name: string | null;
    card_style: string | null;
    is_loss_card: boolean | null;
  } | null;
};

function mapInventoryRowToEntry(row: InventoryRow): CollectionEntry {
  return {
    id: row.id,
    card_id: row.card_id,
    serial_number: row.serial_number ?? null,
    obtained_at: row.obtained_at ?? new Date().toISOString(),
    cards: row.cards
      ? {
          id: row.cards.id,
          name: row.cards.card_name,
          rarity: row.cards.rarity,
          star_level: row.cards.star_level,
          description: row.cards.description,
          image_url: row.cards.card_image_url,
          max_supply: row.cards.max_supply,
          current_supply: row.cards.current_supply,
          person_name: row.cards.person_name,
          card_style: row.cards.card_style,
          is_loss_card: row.cards.is_loss_card,
        }
      : null,
  };
}
