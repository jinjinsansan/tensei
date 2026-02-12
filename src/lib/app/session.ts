import { getServiceSupabase } from '@/lib/supabase/service';
import { getOrCreateSession } from '@/lib/data/session';
import { getOrCreateSessionToken } from '@/lib/session/cookie';
import { loadMainAppSnapshot, type MainAppSnapshot } from '@/lib/app/main-app';
import type { Tables } from '@/types/database';

export async function getSessionWithSnapshot(): Promise<{ session: Tables<'user_sessions'>; snapshot: MainAppSnapshot }>
{
  const token = await getOrCreateSessionToken();
  const supabase = getServiceSupabase();
  const session = await getOrCreateSession(supabase, token);
  const snapshot = loadMainAppSnapshot(session);
  return { session, snapshot };
}
