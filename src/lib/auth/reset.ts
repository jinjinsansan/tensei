import crypto from 'node:crypto';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, Tables } from '@/types/database';

type DbClient = SupabaseClient<Database>;

export async function createPasswordResetToken(client: DbClient, userId: string) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const { data, error } = await client
    .from('password_reset_tokens')
    .insert({
      user_id: userId,
      token,
      expires_at: expiresAt,
    })
    .select('*')
    .single();
  if (error || !data) {
    throw error ?? new Error('Failed to create password reset token');
  }
  return data as Tables<'password_reset_tokens'>;
}

export async function verifyPasswordResetToken(client: DbClient, token: string) {
  const { data, error } = await client
    .from('password_reset_tokens')
    .select('*')
    .eq('token', token)
    .is('used_at', null)
    .limit(1)
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }
  const row = data as Tables<'password_reset_tokens'>;
  if (new Date(row.expires_at) < new Date()) {
    return null;
  }
  return row;
}

export async function markResetTokenUsed(client: DbClient, tokenId: string) {
  await client
    .from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', tokenId);
}
