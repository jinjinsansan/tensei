import { NextResponse } from 'next/server';

import { fetchCd2Settings } from '@/lib/data/cd2-gacha';
import { getServiceSupabase } from '@/lib/supabase/service';
import { buildGachaAssetPath } from '@/lib/gacha/assets';
import type { Cd2Step } from '@/lib/cd2-gacha/types';

// ─── 期待度★計算 ───────────────────────────────────────────
// 4★ → 当たりの中の60%を示唆、5★ → 当たりの中の70%を示唆
// 基準ハズレ率60%時のキャリブレーション済みウエイト
const WIN_STAR_WEIGHTS  = [10, 10, 15, 30, 35]; // stars 1-5
const LOSS_STAR_WEIGHTS = [30, 25, 22, 13, 10]; // stars 1-5

function pickWeighted(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i + 1;
  }
  return weights.length;
}

function computeExpectationStars(isWin: boolean): number {
  return pickWeighted(isWin ? WIN_STAR_WEIGHTS : LOSS_STAR_WEIGHTS);
}

// ─── どんでん返し後の当たり位置選択 ─────────────────────────
type DecisionPoint = 3 | 2 | 1 | 0;

function pickDecisionPoint(): DecisionPoint {
  const r = Math.random();
  if (r < 0.25) return 3;
  if (r < 0.50) return 2;
  if (r < 0.75) return 1;
  return 0;
}

// ─── 3-0カウントダウン末尾のシーケンスを追加 ─────────────────
function appendEnding(seq: Cd2Step[], decisionAt: DecisionPoint, isWin: boolean): void {
  const nums: DecisionPoint[] = [3, 2, 1, 0];
  for (const n of nums) {
    seq.push(`red_${n}` as Cd2Step);
    if (n === decisionAt) {
      if (isWin) {
        seq.push(`red_${n}_win` as Cd2Step);
      } else {
        // red_1_win は存在するが red_1_loss は存在しない → red_loss を使用
        seq.push(n === 1 ? 'red_loss' : (`red_${n}_loss` as Cd2Step));
      }
      break;
    }
  }
}

// ─── シーケンス構築 ────────────────────────────────────────
function buildSequence(
  isWin: boolean,
  isDonden: boolean,
  isPatlite: boolean,
  isFreeze: boolean,
): Cd2Step[] {
  const seq: Cd2Step[] = [];

  // スタンバイ + タイトル
  seq.push('standby', 'title_red');

  // 10→5 カウントダウン
  seq.push('red_10', 'red_9', 'red_8', 'red_7', 'red_6', 'red_5');

  // パトライト差し込み (5と4の間)
  if (isPatlite) seq.push('patlite');

  // 赤4
  seq.push('red_4');

  // フリーズ (3-0を置き換える)
  if (isFreeze) {
    seq.push('freeze');
    return seq;
  }

  // どんでん返し: ハズレ演出 → 逆転 → 10から再スタート → 当たり
  if (isDonden) {
    appendEnding(seq, 0, false); // 0まで行ってハズレ
    seq.push('red_loss');        // 汎用ハズレ映像
    seq.push('patlite', 'donden', 'jackpot');
    // 2週目: 10→4 再度カウントダウン
    seq.push('red_10', 'red_9', 'red_8', 'red_7', 'red_6', 'red_5', 'red_4');
    appendEnding(seq, pickDecisionPoint(), true);
    return seq;
  }

  // 通常エンディング
  appendEnding(seq, pickDecisionPoint(), isWin);
  return seq;
}

// ─── API ──────────────────────────────────────────────────
export async function POST() {
  try {
    const supabase = getServiceSupabase();
    const settings = await fetchCd2Settings(supabase);

    if (!settings.isEnabled) {
      return NextResponse.json(
        { success: false, error: 'カウントダウンチャレンジ２は現在準備中です。' },
        { status: 503 },
      );
    }

    // 当たり/ハズレ判定
    const rawLoss = Math.random() * 100 < settings.lossRate;

    let isDonden = false;
    let isWin: boolean;

    if (rawLoss) {
      // どんでん返し判定
      isDonden = Math.random() * 100 < settings.dondenRate;
      isWin = isDonden; // どんでん返しなら最終的に当たり
    } else {
      isWin = true;
    }

    // フリーズ・パトライト (当たりのみ)
    let isFreeze = false;
    let isPatlite = false;

    if (isWin) {
      isFreeze = Math.random() * 100 < settings.freezeRate;
      if (!isFreeze) {
        isPatlite = Math.random() * 100 < settings.patliteRate;
      }
    }

    const sequence = buildSequence(isWin, isDonden, isPatlite, isFreeze);
    const expectationStars = computeExpectationStars(isWin);

    return NextResponse.json({
      success: true,
      isWin,
      isDonden,
      isPatlite,
      isFreeze,
      sequence,
      videoBasePath: buildGachaAssetPath('cd2'),
      expectationStars,
    });
  } catch (error) {
    console.error('[cd2-gacha/play] error', error);
    return NextResponse.json(
      { success: false, error: 'カウントダウンチャレンジ２の抽選に失敗しました。しばらくして再度お試しください。' },
      { status: 500 },
    );
  }
}
