import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, Tables, TablesInsert, Json } from '@/types/database';

type DbClient = SupabaseClient<Database>;

export async function findSessionByToken(
  client: DbClient,
  sessionToken: string,
): Promise<Tables<'user_sessions'> | null> {
  const { data, error } = await client
    .from('user_sessions')
    .select('*')
    .eq('session_token', sessionToken)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  return (data as Tables<'user_sessions'>) ?? null;
}

export async function createSession(
  client: DbClient,
  sessionToken: string,
  initialTickets = 10,
): Promise<Tables<'user_sessions'>> {
  const metadata: Json = { tickets: initialTickets };
  const payload: TablesInsert<'user_sessions'> = {
    session_token: sessionToken,
    metadata,
  };
  const { data, error } = await client
    .from('user_sessions')
    .insert(payload)
    .select('*')
    .single();
  if (error || !data) {
    throw error ?? new Error('Failed to create user session');
  }
  return data as Tables<'user_sessions'>;
}

export async function getOrCreateSession(
  client: DbClient,
  sessionToken: string,
  options?: { initialTickets?: number },
): Promise<Tables<'user_sessions'>> {
  const existing = await findSessionByToken(client, sessionToken);
  if (existing) {
    return existing;
  }
  return createSession(client, sessionToken, options?.initialTickets ?? 10);
}
