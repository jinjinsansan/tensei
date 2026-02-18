import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, Tables } from '@/types/database';

type DbClient = SupabaseClient<Database>;

export async function fetchNotificationsForUser(
  client: DbClient,
  userId: string,
  options?: { limit?: number },
): Promise<Tables<'user_notifications'>[]> {
  const { data, error } = await client
    .from('user_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(options?.limit ?? 50);
  if (error) {
    throw error;
  }
  return (data as Tables<'user_notifications'>[]) ?? [];
}

export async function markNotificationAsRead(client: DbClient, userId: string, notificationId: string) {
  const { data, error } = await client
    .from('user_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select('*')
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data as Tables<'user_notifications'> | null;
}

export async function fetchMailBroadcastHistory(
  client: DbClient,
  options?: { limit?: number },
): Promise<Tables<'mail_broadcasts'>[]> {
  const { data, error } = await client
    .from('mail_broadcasts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(options?.limit ?? 20);
  if (error) {
    throw error;
  }
  return (data as Tables<'mail_broadcasts'>[]) ?? [];
}

export async function fetchBroadcastLogs(client: DbClient, broadcastId: string) {
  const { data, error } = await client
    .from('mail_broadcast_logs')
    .select('*')
    .eq('broadcast_id', broadcastId)
    .order('created_at', { ascending: false });
  if (error) {
    throw error;
  }
  return (data as Tables<'mail_broadcast_logs'>[]) ?? [];
}
