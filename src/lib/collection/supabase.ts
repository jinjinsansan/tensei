import type { SupabaseClient } from '@supabase/supabase-js';

import type { CollectionEntry, CollectionResponse, CollectionSnapshot } from '@/lib/collection/types';
import type { Database, Tables } from '@/types/database';

type DbClient = SupabaseClient<Database>;

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
  } | null;
};

const INVENTORY_BATCH_SIZE = 200;

export async function fetchCollectionSnapshot(
  client: DbClient,
  userId: string,
): Promise<CollectionSnapshot> {
  const { entries, totalOwned } = await fetchAllInventory(client, userId);
  const [cards, distinctOwned] = await Promise.all([
    fetchAllCards(client),
    fetchDistinctOwned(client, userId),
  ]);

  return {
    collection: entries,
    cards,
    totalOwned,
    distinctOwned,
    totalAvailable: cards.length,
    updatedAt: new Date().toISOString(),
  };
}

export async function fetchCollectionEntryById(
  client: DbClient,
  userId: string,
  entryId: string,
): Promise<CollectionEntry | null> {
  const { data, error } = await client
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
         card_style
       )`,
    )
    .eq('id', entryId)
    .eq('app_user_id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapInventoryRowToEntry(data as InventoryRow);
}

export async function hasUserCollectedCard(
  client: DbClient,
  userId: string,
  cardId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from('card_collection')
    .select('id')
    .eq('app_user_id', userId)
    .eq('card_id', cardId)
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export function sliceSnapshot(
  snapshot: CollectionSnapshot,
  limit: number,
  offset: number,
): CollectionResponse {
  const boundedOffset = Math.max(offset, 0);
  const boundedLimit = Math.max(limit, 1);
  const start = boundedOffset;
  const end = Math.min(start + boundedLimit, snapshot.collection.length);
  const sliced = snapshot.collection.slice(start, end);
  const hasMore = snapshot.totalOwned > boundedOffset + sliced.length;

  return {
    totalOwned: snapshot.totalOwned,
    distinctOwned: snapshot.distinctOwned,
    totalAvailable: snapshot.totalAvailable,
    cards: snapshot.cards,
    collection: sliced,
    page: {
      limit: boundedLimit,
      offset: boundedOffset,
      hasMore,
    },
  };
}

export function buildCollectionEntryFromInventory(
  inventory: Tables<'card_inventory'>,
  card: Tables<'cards'>,
): CollectionEntry {
  return {
    id: inventory.id,
    card_id: inventory.card_id,
    serial_number: inventory.serial_number ?? null,
    obtained_at: inventory.obtained_at ?? new Date().toISOString(),
    cards: {
      id: card.id,
      name: card.card_name,
      rarity: card.rarity,
      star_level: card.star_level,
      description: card.description,
      image_url: card.card_image_url,
      max_supply: card.max_supply,
      current_supply: card.current_supply,
      person_name: card.person_name,
      card_style: card.card_style,
    },
  };
}

async function fetchAllInventory(client: DbClient, userId: string) {
  const entries: CollectionEntry[] = [];
  let offset = 0;
  let totalOwned = 0;

  while (true) {
    const shouldCount = offset === 0;
    const { data, error, count } = await client
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
           card_style
         )`,
        shouldCount ? { count: 'exact' } : undefined,
      )
      .eq('app_user_id', userId)
      .order('obtained_at', { ascending: false })
      .range(offset, offset + INVENTORY_BATCH_SIZE - 1);

    if (error) {
      throw new Error(error.message);
    }

    if (shouldCount && typeof count === 'number') {
      totalOwned = count;
    }

    const mappedRows = (data ?? []).map(mapInventoryRowToEntry);
    entries.push(...mappedRows);

    if (!data || data.length < INVENTORY_BATCH_SIZE) {
      break;
    }
    offset += INVENTORY_BATCH_SIZE;
  }

  if (!totalOwned) {
    totalOwned = entries.length;
  }

  return { entries, totalOwned };
}

async function fetchAllCards(client: DbClient) {
  const { data, error } = await client
    .from('cards')
    .select('id, card_name, rarity, card_image_url')
    .eq('is_active', true)
    .order('rarity', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((card) => ({
    id: card.id,
    name: card.card_name,
    rarity: card.rarity,
    image_url: card.card_image_url,
  }));
}

async function fetchDistinctOwned(client: DbClient, userId: string) {
  const { count, error } = await client
    .from('card_collection')
    .select('id', { count: 'exact', head: true })
    .eq('app_user_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

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
        }
      : null,
  };
}
