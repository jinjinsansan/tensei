import { createClient } from '@supabase/supabase-js';

import { getPublicEnv } from '@/lib/env';

const publicEnv = getPublicEnv();

export function createBrowserSupabaseClient() {
  return createClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL ?? '',
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  );
}
