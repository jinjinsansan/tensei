"use server";

import { redirect } from 'next/navigation';

import { getServiceSupabase } from '@/lib/supabase/service';
import { getOrCreateSession } from '@/lib/data/session';
import { getOrCreateSessionToken } from '@/lib/session/cookie';

export async function enterNeonHall() {
  const supabase = getServiceSupabase();
  const token = await getOrCreateSessionToken();
  await getOrCreateSession(supabase, token);
  redirect('/home');
}
