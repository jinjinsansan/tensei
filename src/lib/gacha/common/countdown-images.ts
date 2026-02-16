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
 * カウントダウンの色に基づくエフェクト設定
 */
export interface CountdownEffect {
  scale: number[];
  glow: string;
  flashIntensity: number;
  shake: boolean;
  particles: boolean;
  duration: number;
}

export const COUNTDOWN_EFFECTS: Record<CdColor, CountdownEffect> = {
  green: {
    scale: [0.8, 1],
    glow: 'rgba(0, 255, 0, 0.3)',
    flashIntensity: 0.1,
    shake: false,
    particles: false,
    duration: 0.3,
  },
  blue: {
    scale: [0.7, 1.1, 1],
    glow: 'rgba(0, 150, 255, 0.5)',
    flashIntensity: 0.2,
    shake: false,
    particles: false,
    duration: 0.4,
  },
  red: {
    scale: [0.5, 1.2, 1],
    glow: 'rgba(255, 50, 50, 0.7)',
    flashIntensity: 0.3,
    shake: true,
    particles: false,
    duration: 0.45,
  },
  rainbow: {
    scale: [0.3, 1.3, 1],
    glow: 'rgba(255, 215, 0, 0.9)',
    flashIntensity: 0.5,
    shake: true,
    particles: true,
    duration: 0.5,
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
