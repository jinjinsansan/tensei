import { NextResponse } from 'next/server';

import { getServiceSupabase } from '@/lib/supabase/service';
import {
  fetchGachaResultById,
  fetchCardById,
  ensureGachaResultAwarded,
  setGachaHistoryStatus,
} from '@/lib/data/gacha';
import { buildCollectionEntryFromInventory } from '@/lib/collection/supabase';
import { emitCollectionEventToEdge } from '@/lib/cloudflare/collection-cache';

const CRON_SECRET = process.env.CRON_SECRET;
// 未付与を自動付与するまでの時間（時間単位）
const AUTO_AWARD_AFTER_HOURS = 24;
// 1回の実行で処理する最大件数
const BATCH_LIMIT = 100;

// Vercel Cron から呼ばれる自動付与バッチ
// vercel.json に設定: { "crons": [{ "path": "/api/cron/auto-award", "schedule": "0 * * * *" }] }
export async function GET(request: Request) {
  // Vercel Cron または CRON_SECRET による認証
  const authHeader = request.headers.get('authorization');
  const cronSecret = CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const cutoff = new Date(Date.now() - AUTO_AWARD_AFTER_HOURS * 60 * 60 * 1000).toISOString();

  // 24時間超の未付与 gacha_results を取得
  const { data: pendingResults, error } = await supabase
    .from('gacha_results')
    .select('id, app_user_id, user_session_id, card_id, history_id, card_awarded')
    .eq('card_awarded', false)
    .lt('created_at', cutoff)
    .limit(BATCH_LIMIT);

  if (error) {
    console.error('auto-award fetch error', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = pendingResults ?? [];
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

      const cardId = resultRow.card_id;
      if (!cardId || !resultRow.app_user_id) {
        errors.push(`${row.id}: card_id or app_user_id missing`);
        continue;
      }

      const card = await fetchCardById(supabase, cardId);
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
      console.error(`auto-award failed for ${row.id}:`, msg);
      errors.push(`${row.id}: ${msg}`);
    }
  }

  return NextResponse.json({
    success: true,
    total: rows.length,
    awarded,
    skipped,
    errors,
    cutoff,
  });
}
