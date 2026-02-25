import { NextResponse } from 'next/server';

import { prepareNumbersDraw, recordNumbersResult } from '@/lib/data/numbers-gacha';
import { sanitizeScenarioSteps } from '@/lib/numbers-gacha/default-scenarios';
import type { NumbersStep } from '@/lib/numbers-gacha/types';
import { getServiceSupabase } from '@/lib/supabase/service';
import { buildGachaAssetPath } from '@/lib/gacha/assets';

// 結果レア度 → 期待度レベル(1-5)変換 (60%精度でぼかす)
function computeExpectationStars(resultType: string): number {
  const trueLevel = (() => {
    if (resultType === 'miss')   return 1;
    const n = Number(resultType.replace('star', ''));
    if (n <= 2)  return 1;
    if (n <= 4)  return 2;
    if (n <= 6)  return 3;
    if (n <= 9)  return 4;
    return 5;
  })();
  // 60%の確率で正確、40%でランダム
  if (Math.random() < 0.6) return trueLevel;
  return Math.floor(Math.random() * 5) + 1;
}

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
      expectationStars: computeExpectationStars(resultType),
    });
  } catch (error) {
    console.error('[numbers-gacha/play] error', error);
    return NextResponse.json(
      { success: false, error: 'ナンバーズガチャの抽選に失敗しました。しばらくして再度お試しください。' },
      { status: 500 },
    );
  }
}
