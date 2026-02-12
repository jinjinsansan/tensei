import { NextResponse } from 'next/server';

import { getServiceSupabase } from '@/lib/supabase/service';
import { getOrCreateSession } from '@/lib/data/session';
import { getOrCreateSessionToken } from '@/lib/session/cookie';
import { loadMainAppSnapshot } from '@/lib/app/main-app';

export async function GET() {
  try {
    const token = await getOrCreateSessionToken();
    const supabase = getServiceSupabase();
    const session = await getOrCreateSession(supabase, token);
    const snapshot = loadMainAppSnapshot(session);
    return NextResponse.json(snapshot, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    console.error('main-app snapshot failed', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'アプリ情報の取得に失敗しました。' },
      { status: 500 },
    );
  }
}
