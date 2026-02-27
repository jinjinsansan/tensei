import { NextResponse } from 'next/server';

import { fetchCd2Settings } from '@/lib/data/cd2-gacha';
import { getServiceSupabase } from '@/lib/supabase/service';
import { buildGachaAssetPath } from '@/lib/gacha/assets';
import type { Cd2Step } from '@/lib/cd2-gacha/types';

// ─── 期待度★計算 ────────────────────────────────────────────
// 仕様書: WIN時→★4/★5を使用可, LOSS時→★1〜★3のみ
// (ただしどんでん返し初回表示はLOSSに見えるため★1〜3)
const WIN_STAR_WEIGHTS  = [5, 10, 20, 30, 35]; // stars 1-5
const LOSS_STAR_WEIGHTS = [25, 40, 35,  0,  0]; // stars 1-5 (★4/5は0)

function pickWeighted(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i + 1;
  }
  return weights.length;
}

// isInitiallyLoss: どんでん返しの初回表示はLOSS寄りの★にする
function computeExpectationStars(isWin: boolean, isDonden: boolean): number {
  return pickWeighted(isWin && !isDonden ? WIN_STAR_WEIGHTS : LOSS_STAR_WEIGHTS);
}

// ─── 決定番号選択 ──────────────────────────────────────────
type DecisionPoint = 3 | 2 | 1 | 0;

function pickDecisionPoint(): DecisionPoint {
  const r = Math.random();
  if (r < 0.25) return 3;
  if (r < 0.50) return 2;
  if (r < 0.75) return 1;
  return 0;
}

// ─── 3-0 エンディングシーケンスを追加 ─────────────────────────
// 仕様書: 決定番号より前の数字は「通過映像」(red_X.mp4)を使用。
// 決定番号では直接 win/loss 映像を使用（通過映像は挟まない）。
// 例: 2で当たり → red_3(通過) → red_2_win
// 例: 3でハズレ → red_3_loss (通過なし)
function appendEnding(seq: Cd2Step[], decisionAt: DecisionPoint, isWin: boolean): void {
  const nums: DecisionPoint[] = [3, 2, 1, 0];
  for (const n of nums) {
    if (n > decisionAt) {
      // 通過映像（決定番号より前）
      seq.push(`red_${n}` as Cd2Step);
    } else {
      // 決定番号: 直接 win または loss 映像
      if (isWin) {
        seq.push(`red_${n}_win` as Cd2Step);
      } else {
        seq.push(`red_${n}_loss` as Cd2Step); // red_1_loss はプレイヤー側で red_loss.mp4 にフォールバック
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

  // スタンバイ + タイトル (タイトルは自動再生・NEXTなし)
  seq.push('standby', 'title_red');

  // フリーズ: カウントダウン中のランダムな位置で発動
  // jackpot映像 → 黒画面10秒の順で演出
  if (isFreeze) {
    const stopOptions: number[] = [1, 2, 3, 4, 5, 6]; // red_10〜red_5 の何番目まで見せるか
    const stopAt = stopOptions[Math.floor(Math.random() * stopOptions.length)];
    const numbers = [10, 9, 8, 7, 6, 5, 4];
    for (let i = 0; i < stopAt; i++) {
      seq.push(`red_${numbers[i]}` as Cd2Step);
    }
    seq.push('jackpot', 'freeze'); // jackpot自動再生 → フリーズ黒画面
    return seq;
  }

  // 通常カウントダウン 10→5
  seq.push('red_10', 'red_9', 'red_8', 'red_7', 'red_6', 'red_5');

  // パトライト差し込み (5と4の間・自動再生・NEXTなし)
  if (isPatlite) seq.push('patlite');

  // 赤4
  seq.push('red_4');

  // どんでん返し
  // ハズレ映像 → patlite(自動) → donden(自動) → 10から再スタート → 必ず当たり
  if (isDonden) {
    const lossAt = pickDecisionPoint();
    appendEnding(seq, lossAt, false);          // ハズレ演出
    seq.push('patlite', 'donden');             // 逆転演出 (自動再生)
    // 2週目: 10→4 (★オーバーレイなし)
    seq.push('red_10', 'red_9', 'red_8', 'red_7', 'red_6', 'red_5', 'red_4');
    appendEnding(seq, pickDecisionPoint(), true); // 必ず当たり
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
    const expectationStars = computeExpectationStars(isWin, isDonden);

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
