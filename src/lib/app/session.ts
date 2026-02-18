import type { SupabaseClient } from '@supabase/supabase-js';

import { getServiceSupabase } from '@/lib/supabase/service';
import { findSessionByToken } from '@/lib/data/session';
import { getSessionToken } from '@/lib/session/cookie';
import { loadMainAppSnapshot, type MainAppSnapshot } from '@/lib/app/main-app';
import { findUserById } from '@/lib/data/users';
import { getTicketBalances } from '@/lib/data/tickets';
import type { Database, Tables } from '@/types/database';

type AuthedContext = {
  session: Tables<'user_sessions'>;
  user: Tables<'app_users'>;
};

export async function fetchAuthedContext(client?: SupabaseClient<Database>): Promise<AuthedContext | null> {
  const token = await getSessionToken();
  if (!token) return null;
  const supabase = client ?? getServiceSupabase();
  const session = await findSessionByToken(supabase, token);
  if (!session || !session.app_user_id) {
    return null;
  }
  const user = await findUserById(supabase, session.app_user_id);
  if (!user) {
    return null;
  }
  if (user.is_blocked || user.deleted_at) {
    return null;
  }
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
