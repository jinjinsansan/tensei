import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, Tables } from '@/types/database';
import type { TicketBalanceItem } from '@/lib/utils/tickets';

type DbClient = SupabaseClient<Database>;

const DEFAULT_TICKET_CODE = 'basic';

async function fetchTicketTypes(client: DbClient): Promise<Tables<'ticket_types'>[]> {
  const { data, error } = await client.from('ticket_types').select('*').order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Tables<'ticket_types'>[];
}

async function fetchTicketTypeByCode(client: DbClient, code: string): Promise<Tables<'ticket_types'>> {
  const { data, error } = await client.from('ticket_types').select('*').eq('code', code).single();
  if (error || !data) {
    throw new Error(`指定のチケット (${code}) が見つかりません。`);
  }
  return data as Tables<'ticket_types'>;
}

async function ensureUserTicketRow(
  client: DbClient,
  userId: string,
  ticketTypeId: string,
): Promise<Tables<'user_tickets'>> {
  const { data, error } = await client
    .from('user_tickets')
    .select('*')
    .eq('user_id', userId)
    .eq('ticket_type_id', ticketTypeId)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  if (data) {
    return data as Tables<'user_tickets'>;
  }
  const { data: inserted, error: insertError } = await client
    .from('user_tickets')
    .insert({ user_id: userId, ticket_type_id: ticketTypeId, quantity: 0 })
    .select('*')
    .single();
  if (insertError || !inserted) {
    throw insertError ?? new Error('チケット残高の作成に失敗しました。');
  }
  return inserted as Tables<'user_tickets'>;
}

export async function getTicketBalances(client: DbClient, userId: string): Promise<TicketBalanceItem[]> {
  const [types, balanceResponse] = await Promise.all([
    fetchTicketTypes(client),
    client.from('user_tickets').select('*').eq('user_id', userId),
  ]);
  if (balanceResponse.error) {
    throw balanceResponse.error;
  }
  const balanceMap = new Map<string, number>();
  if (balanceResponse.data) {
    for (const row of balanceResponse.data as Tables<'user_tickets'>[]) {
      balanceMap.set(row.ticket_type_id, row.quantity);
    }
  }
  return types.map((type) => ({
    code: type.code,
    name: type.name,
    quantity: balanceMap.get(type.id) ?? 0,
    colorToken: type.color_token,
    sortOrder: type.sort_order,
  }));
}

export async function ensureInitialTickets(client: DbClient, userId: string, quantity = 30) {
  const basic = await fetchTicketTypeByCode(client, DEFAULT_TICKET_CODE);
  await ensureUserTicketRow(client, userId, basic.id);
  await client
    .from('user_tickets')
    .update({ quantity, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('ticket_type_id', basic.id);
}

export async function grantTickets(
  client: DbClient,
  userId: string,
  code: string,
  amount: number,
): Promise<number> {
  if (amount <= 0) return 0;
  const type = await fetchTicketTypeByCode(client, code);
  const row = await ensureUserTicketRow(client, userId, type.id);
  const nextQuantity = row.quantity + amount;
  const { data, error } = await client
    .from('user_tickets')
    .update({ quantity: nextQuantity, updated_at: new Date().toISOString() })
    .eq('id', row.id)
    .select('quantity')
    .single();
  if (error || !data) {
    throw error ?? new Error('チケットの付与に失敗しました。');
  }
  return data.quantity as number;
}

export async function consumeTicket(
  client: DbClient,
  userId: string,
  options?: { ticketCode?: string },
): Promise<{ remaining: number; ticketCode: string }> {
  const code = options?.ticketCode ?? DEFAULT_TICKET_CODE;
  const type = await fetchTicketTypeByCode(client, code);
  const row = await ensureUserTicketRow(client, userId, type.id);
  if (row.quantity <= 0) {
    throw new Error('チケットが足りません。');
  }
  const nextQuantity = row.quantity - 1;
  const { error } = await client
    .from('user_tickets')
    .update({ quantity: nextQuantity, updated_at: new Date().toISOString() })
    .eq('id', row.id);
  if (error) {
    throw error;
  }
  return { remaining: nextQuantity, ticketCode: code };
}
