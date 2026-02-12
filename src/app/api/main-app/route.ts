import { NextResponse } from 'next/server';

import { getServiceSupabase } from '@/lib/supabase/service';
import { getSessionWithSnapshot } from '@/lib/app/session';

export async function GET() {
  try {
    const supabase = getServiceSupabase();
    const { snapshot } = await getSessionWithSnapshot(supabase);
    return NextResponse.json(snapshot, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    console.error('main-app snapshot failed', error);
    const status = error instanceof Error && error.message.includes('ログイン') ? 401 : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'アプリ情報の取得に失敗しました。' },
      { status },
    );
  }
}
