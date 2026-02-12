import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, Tables, TablesInsert, Json, TablesUpdate } from '@/types/database';

type DbClient = SupabaseClient<Database>;

type SessionOptions = {
  metadata?: Json;
  appUserId?: string | null;
};

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
  options?: SessionOptions,
): Promise<Tables<'user_sessions'>> {
  const payload: TablesInsert<'user_sessions'> = {
    session_token: sessionToken,
    metadata: options?.metadata ?? {},
    app_user_id: options?.appUserId ?? null,
  };
  const { data, error } = await client.from('user_sessions').insert(payload).select('*').single();
  if (error || !data) {
    throw error ?? new Error('Failed to create user session');
  }
  return data as Tables<'user_sessions'>;
}

export async function updateSession(
  client: DbClient,
  sessionId: string,
  patch: TablesUpdate<'user_sessions'>,
): Promise<Tables<'user_sessions'>> {
  const { data, error } = await client
    .from('user_sessions')
    .update({ ...patch, last_seen_at: new Date().toISOString() })
    .eq('id', sessionId)
    .select('*')
    .single();
  if (error || !data) {
    throw error ?? new Error('Failed to update user session');
  }
  return data as Tables<'user_sessions'>;
}

export async function getOrCreateSession(
  client: DbClient,
  sessionToken: string,
  options?: SessionOptions,
): Promise<Tables<'user_sessions'>> {
  const existing = await findSessionByToken(client, sessionToken);
  if (existing) {
    if (options?.appUserId && existing.app_user_id !== options.appUserId) {
      return updateSession(client, existing.id, {
        app_user_id: options.appUserId,
        metadata: options.metadata ?? existing.metadata,
      });
    }
    if (options?.metadata) {
      return updateSession(client, existing.id, {
        metadata: options.metadata,
      });
    }
    return existing;
  }
  return createSession(client, sessionToken, options);
}

export async function attachSessionToUser(
  client: DbClient,
  sessionToken: string,
  appUserId: string,
  metadata?: Json,
): Promise<Tables<'user_sessions'>> {
  return getOrCreateSession(client, sessionToken, { appUserId, metadata });
}
