import { NextResponse } from 'next/server';

import { prepareNumbersDraw, recordNumbersResult } from '@/lib/data/numbers-gacha';
import { sanitizeScenarioSteps } from '@/lib/numbers-gacha/default-scenarios';
import type { NumbersStep } from '@/lib/numbers-gacha/types';
import { getServiceSupabase } from '@/lib/supabase/service';
import { buildGachaAssetPath } from '@/lib/gacha/assets';

export async function POST() {
  try {
    const supabase = getServiceSupabase();
    const { scenario, resultType } = await prepareNumbersDraw(supabase);

    const sequence = sanitizeScenarioSteps(scenario.sequence) as NumbersStep[];
    const finalStage = scenario.finalStage;

    const logId = await recordNumbersResult(supabase, {
      resultType,
      scenarioId: scenario.id ?? null,
      scenarioCode: scenario.code,
      finalStage,
      puchunTriggered: sequence.includes('puchun'),
      totalVideoCount: sequence.length,
    });

    return NextResponse.json({
      success: true,
      resultType,
      sequence,
      finalStage,
      scenarioCode: scenario.code,
      scenarioId: scenario.id ?? null,
      resultLogId: logId,
      videoBasePath: buildGachaAssetPath('numbers'),
    });
  } catch (error) {
    console.error('[numbers-gacha/play] error', error);
    return NextResponse.json(
      { success: false, error: 'ナンバーズガチャの抽選に失敗しました。しばらくして再度お試しください。' },
      { status: 500 },
    );
  }
}
