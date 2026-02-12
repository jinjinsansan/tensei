import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, Tables, TablesInsert } from '@/types/database';

type DbClient = SupabaseClient<Database>;

export async function findUserByEmail(client: DbClient, email: string): Promise<Tables<'app_users'> | null> {
  const normalized = email.trim().toLowerCase();
  const { data, error } = await client
    .from('app_users')
    .select('*')
    .eq('email', normalized)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  return (data as Tables<'app_users'>) ?? null;
}

export async function findUserById(client: DbClient, userId: string): Promise<Tables<'app_users'> | null> {
  const { data, error } = await client.from('app_users').select('*').eq('id', userId).maybeSingle();
  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  return (data as Tables<'app_users'>) ?? null;
}

export async function createUser(
  client: DbClient,
  payload: Omit<TablesInsert<'app_users'>, 'id' | 'created_at' | 'updated_at'>,
): Promise<Tables<'app_users'>> {
  const insertPayload: TablesInsert<'app_users'> = {
    ...payload,
    email: payload.email.trim().toLowerCase(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await client.from('app_users').insert(insertPayload).select('*').single();
  if (error || !data) {
    throw error ?? new Error('利用者の作成に失敗しました。');
  }
  return data as Tables<'app_users'>;
}

export async function touchLastLogin(client: DbClient, userId: string) {
  await client
    .from('app_users')
    .update({ last_login_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', userId);
}
