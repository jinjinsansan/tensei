import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, Tables } from '@/types/database';

type DbClient = SupabaseClient<Database>;

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

export type TicketPurchaseEntry = {
  id: string;
  createdAt: string;
  quantity: number;
  amountCents: number;
  currency: string;
  status: string;
  paymentMethod: string;
  externalReference: string | null;
  note: string | null;
  ticketTypeCode: string | null;
  ticketTypeName: string | null;
  ticketTypeColor: string | null;
};

export type GachaPlayEntry = {
  id: string;
  historyId: string | null;
  createdAt: string;
  starLevel: number;
  hadReversal: boolean;
  obtainedVia: string;
  cardName: string | null;
  cardRarity: string | null;
  cardImageUrl: string | null;
  characterName: string | null;
};

export type CardTransferEntry = {
  id: string;
  createdAt: string;
  direction: 'sent' | 'received';
  cardName: string | null;
  cardRarity: string | null;
  serialNumber: number | null;
  counterpartId: string;
  counterpartLabel: string;
  note: string | null;
};

export type TransactionHistoryPayload = {
  ticketPurchases: TicketPurchaseEntry[];
  gachaPlays: GachaPlayEntry[];
  cardTransfers: CardTransferEntry[];
};

type TicketPurchaseRow = Tables<'ticket_purchase_history'> & {
  ticket_types: {
    id: string;
    code: string;
    name: string;
    color_token: string | null;
  } | null;
};

type GachaResultRow = Tables<'gacha_results'> & {
  cards: {
    id: string;
    card_name: string;
    rarity: string;
    star_level: number | null;
    card_image_url: string | null;
  } | null;
  characters: {
    id: string;
    name: string;
  } | null;
};

type CardTransferRow = Tables<'card_transfers'> & {
  card_inventory: {
    id: string;
    serial_number: number;
    cards: {
      id: string;
      card_name: string;
      rarity: string;
    } | null;
  } | null;
  from_user: Pick<Tables<'app_users'>, 'id' | 'display_name' | 'email'> | null;
  to_user: Pick<Tables<'app_users'>, 'id' | 'display_name' | 'email'> | null;
};

type HistoryOptions = {
  limit?: number | null;
};

export async function fetchTransactionHistory(
  client: DbClient,
  userId: string,
  options?: HistoryOptions,
): Promise<TransactionHistoryPayload> {
  const limit = clampLimit(options?.limit);
  const [ticketPurchases, gachaPlays, cardTransfers] = await Promise.all([
    fetchTicketPurchases(client, userId, limit),
    fetchGachaPlays(client, userId, limit),
    fetchCardTransfers(client, userId, limit),
  ]);

  return {
    ticketPurchases,
    gachaPlays,
    cardTransfers,
  };
}

async function fetchTicketPurchases(client: DbClient, userId: string, limit: number): Promise<TicketPurchaseEntry[]> {
  const { data, error } = await client
    .from('ticket_purchase_history')
    .select(
      `id, quantity, amount_cents, currency, status, payment_method, external_reference, note, metadata, created_at,
       ticket_types:ticket_type_id (id, code, name, color_token)`,
    )
    .eq('app_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as TicketPurchaseRow[];
  return rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    quantity: row.quantity,
    amountCents: row.amount_cents,
    currency: row.currency,
    status: row.status,
    paymentMethod: row.payment_method,
    externalReference: row.external_reference ?? null,
    note: row.note ?? null,
    ticketTypeCode: row.ticket_types?.code ?? null,
    ticketTypeName: row.ticket_types?.name ?? null,
    ticketTypeColor: row.ticket_types?.color_token ?? null,
  }));
}

async function fetchGachaPlays(client: DbClient, userId: string, limit: number): Promise<GachaPlayEntry[]> {
  const { data, error } = await client
    .from('gacha_results')
    .select(
      `id, history_id, star_level, had_reversal, obtained_via, created_at,
       cards:card_id (id, card_name, rarity, star_level, card_image_url),
       characters:character_id (id, name)`,
    )
    .eq('app_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as GachaResultRow[];
  return rows.map((row) => ({
    id: row.id,
    historyId: row.history_id ?? null,
    createdAt: row.created_at,
    starLevel: row.star_level,
    hadReversal: row.had_reversal ?? false,
    obtainedVia: row.obtained_via,
    cardName: row.cards?.card_name ?? null,
    cardRarity: row.cards?.rarity ?? null,
    cardImageUrl: row.cards?.card_image_url ?? null,
    characterName: row.characters?.name ?? null,
  }));
}

async function fetchCardTransfers(client: DbClient, userId: string, limit: number): Promise<CardTransferEntry[]> {
  const { data, error } = await client
    .from('card_transfers')
    .select(
      `id, card_inventory_id, from_user_id, to_user_id, created_at, note,
       card_inventory:card_inventory_id (
         id,
         serial_number,
         cards:card_id (id, card_name, rarity)
       )`,
    )
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Omit<CardTransferRow, 'from_user' | 'to_user'>[];
  
  // Collect all unique user IDs
  const userIds = new Set<string>();
  rows.forEach((row) => {
    if (row.from_user_id) userIds.add(row.from_user_id);
    if (row.to_user_id) userIds.add(row.to_user_id);
  });

  // Fetch user info in one query
  const userMap = new Map<string, { id: string; display_name: string | null; email: string }>();
  if (userIds.size > 0) {
    const { data: users } = await client
      .from('app_users')
      .select('id, display_name, email')
      .in('id', Array.from(userIds));
    
    (users ?? []).forEach((user) => {
      userMap.set(user.id, user);
    });
  }

  return rows.map((row) => {
    const direction: 'sent' | 'received' = row.from_user_id === userId ? 'sent' : 'received';
    const counterpartUserId = direction === 'sent' ? row.to_user_id : row.from_user_id;
    const counterpart = counterpartUserId ? userMap.get(counterpartUserId) : null;
    const counterpartId = counterpartUserId ?? 'unknown';
    const counterpartLabel =
      counterpart?.display_name?.trim() || counterpart?.email?.trim() || counterpartId;

    return {
      id: row.id,
      createdAt: row.created_at,
      direction,
      cardName: row.card_inventory?.cards?.card_name ?? null,
      cardRarity: row.card_inventory?.cards?.rarity ?? null,
      serialNumber: row.card_inventory?.serial_number ?? null,
      counterpartId,
      counterpartLabel,
      note: row.note ?? null,
    };
  });
}

function clampLimit(raw?: number | null) {
  if (typeof raw !== 'number' || Number.isNaN(raw)) {
    return DEFAULT_LIMIT;
  }
  return Math.min(Math.max(Math.floor(raw), 1), MAX_LIMIT);
}
