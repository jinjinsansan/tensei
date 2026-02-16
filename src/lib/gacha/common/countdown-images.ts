/**
 * カウントダウン静止画マッピング
 * 動画から静止画に変更することで、iPhoneでの効果音タイミング問題を解決
 */

import type { CdColor } from './types';

/**
 * カウントダウン画像のパスを取得（9:16版）
 */
export function getCountdownImagePath(color: CdColor, index: number): string {
  const colorName = color.toLowerCase();
  return `/images/countdown/cd_${colorName}_916_${index}.png`;
}

/**
 * カウントダウン共通アニメーション（奥から浮かび上がる）
 */
export const FLOAT_IN_ANIMATION = {
  scale: [0.45, 1.08, 1],
  opacity: [0, 1],
  duration: 0.52,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

export interface CountdownEffect {
  glow: string;
  flashIntensity: number;
}

export const COUNTDOWN_EFFECTS: Record<CdColor, CountdownEffect> = {
  green: {
    glow: 'rgba(120, 255, 180, 0.45)',
    flashIntensity: 0.18,
  },
  blue: {
    glow: 'rgba(120, 200, 255, 0.55)',
    flashIntensity: 0.24,
  },
  red: {
    glow: 'rgba(255, 150, 150, 0.65)',
    flashIntensity: 0.32,
  },
  rainbow: {
    glow: 'rgba(255, 230, 150, 0.78)',
    flashIntensity: 0.45,
  },
};

/**
 * 利用可能な画像インデックス（1-8）
 */
export const COUNTDOWN_IMAGE_INDICES = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/**
 * 指定された色とステップ数に対応する画像パスの配列を返す
 */
export function getCountdownImagesForColor(color: CdColor, count: number = 8): string[] {
  return COUNTDOWN_IMAGE_INDICES.slice(0, count).map((index) => getCountdownImagePath(color, index));
}
