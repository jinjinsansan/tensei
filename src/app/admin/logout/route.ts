import { NextResponse } from 'next/server';

import { getServiceSupabase } from '@/lib/supabase/service';

export async function POST() {
  const supabase = getServiceSupabase();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/admin/login', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'));
}
