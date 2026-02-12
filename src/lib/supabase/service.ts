import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';
import { getServerEnv } from '@/lib/env';

let serviceClient: SupabaseClient<Database> | null = null;

export function getServiceSupabase(): SupabaseClient<Database> {
  if (!serviceClient) {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();
    serviceClient = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return serviceClient;
}
