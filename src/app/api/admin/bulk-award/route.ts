import { NextResponse } from 'next/server';

import { fetchAuthedContext } from '@/lib/app/session';
import { getServiceSupabase } from '@/lib/supabase/service';
import {
  fetchGachaResultById,
  fetchCardById,
  ensureGachaResultAwarded,
  setGachaHistoryStatus,
} from '@/lib/data/gacha';
import { buildCollectionEntryFromInventory } from '@/lib/collection/supabase';
import { emitCollectionEventToEdge } from '@/lib/cloudflare/collection-cache';

type RequestBody = {
  userId: string;
};

// Admin: 指定ユーザーの未付与 gacha_results を全件一括付与
export async function POST(request: Request) {
  const supabase = getServiceSupabase();

  const context = await fetchAuthedContext(supabase).catch(() => null);
  if (!context || !context.user.is_admin) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const { userId } = body;
  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const { data: pendingRows, error: fetchError } = await supabase
    .from('gacha_results')
    .select('id, app_user_id, user_session_id, card_id, history_id, card_awarded')
    .eq('app_user_id', userId)
    .eq('card_awarded', false)
    .limit(200);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const rows = pendingRows ?? [];
  let awarded = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const resultRow = await fetchGachaResultById(supabase, row.id);
      if (resultRow.card_awarded) {
        skipped += 1;
        continue;
      }
      if (!resultRow.card_id || !resultRow.app_user_id) {
        errors.push(`${row.id}: missing card_id or app_user_id`);
        continue;
      }
      const card = await fetchCardById(supabase, resultRow.card_id);
      const awardOutcome = await ensureGachaResultAwarded(supabase, {
        resultRow,
        card,
        appUserId: resultRow.app_user_id,
        userSessionId: resultRow.user_session_id,
      });
      if (awardOutcome.didAward && awardOutcome.inventoryRow) {
        const entry = buildCollectionEntryFromInventory(awardOutcome.inventoryRow, awardOutcome.card);
        void emitCollectionEventToEdge(resultRow.app_user_id, {
          type: 'add',
          entry,
          totalOwnedDelta: 1,
          distinctOwnedDelta: awardOutcome.alreadyOwnedBeforeAward ? 0 : 1,
        });
      }
      await setGachaHistoryStatus(supabase, resultRow.history_id, 'success');
      awarded += 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${row.id}: ${msg}`);
    }
  }

  return NextResponse.json({
    success: true,
    total: rows.length,
    awarded,
    skipped,
    errors,
  });
}
