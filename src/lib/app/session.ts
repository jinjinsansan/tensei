import type { SupabaseClient } from '@supabase/supabase-js';

import { getServiceSupabase } from '@/lib/supabase/service';
import { findSessionByToken } from '@/lib/data/session';
import { getSessionToken } from '@/lib/session/cookie';
import { loadMainAppSnapshot, type MainAppSnapshot } from '@/lib/app/main-app';
import { findUserById, touchLastLogin } from '@/lib/data/users';
import { getTicketBalances } from '@/lib/data/tickets';
import type { Database, Tables } from '@/types/database';

type AuthedContext = {
  session: Tables<'user_sessions'>;
  user: Tables<'app_users'>;
};

const LAST_LOGIN_REFRESH_INTERVAL_MS = 1000 * 60 * 60; // 1 hour

async function refreshLastLoginIfNeeded(
  client: SupabaseClient<Database>,
  user: Tables<'app_users'>,
): Promise<Tables<'app_users'>> {
  const lastLogin = user.last_login_at ? new Date(user.last_login_at).getTime() : 0;
  const now = Date.now();
  if (!lastLogin || now - lastLogin >= LAST_LOGIN_REFRESH_INTERVAL_MS) {
    const nextValue = new Date().toISOString();
    await touchLastLogin(client, user.id);
    return { ...user, last_login_at: nextValue };
  }
  return user;
}

export async function fetchAuthedContext(client?: SupabaseClient<Database>): Promise<AuthedContext | null> {
  const token = await getSessionToken();
  if (!token) return null;
  const supabase = client ?? getServiceSupabase();
  const session = await findSessionByToken(supabase, token);
  if (!session || !session.app_user_id) {
    return null;
  }
  const userRecord = await findUserById(supabase, session.app_user_id);
  if (!userRecord) {
    return null;
  }
  if (userRecord.is_blocked || userRecord.deleted_at) {
    return null;
  }
  const user = await refreshLastLoginIfNeeded(supabase, userRecord);
  return { session, user };
}

export async function getSessionWithSnapshot(client?: SupabaseClient<Database>): Promise<{
  session: Tables<'user_sessions'>;
  user: Tables<'app_users'>;
  snapshot: MainAppSnapshot;
}> {
  const supabase = client ?? getServiceSupabase();
  const context = await fetchAuthedContext(supabase);
  if (!context) {
    throw new Error('ログインが必要です。');
  }
  const tickets = await getTicketBalances(supabase, context.user.id);
  const snapshot = loadMainAppSnapshot({ user: context.user, tickets });
  return { ...context, snapshot };
}
