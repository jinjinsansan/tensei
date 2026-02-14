import { buildCommonAssetPath } from '@/lib/gacha/assets';
import { selectCountdownGrade } from '@/lib/gacha/common/probabilities';
import { COUNTDOWN_PATTERNS } from '@/lib/gacha/common/countdown-patterns';
import type { CountdownPattern, CountdownStep, Grade, Rarity } from '@/lib/gacha/common/types';

export type CountdownSelection = {
  grade: Grade;
  pattern: CountdownPattern;
};

export function chooseCountdownPattern(rarity: Rarity): CountdownSelection {
  const grade = selectCountdownGrade(rarity);
  const patterns = COUNTDOWN_PATTERNS[grade];
  const pattern = patterns[Math.floor(Math.random() * patterns.length)];
  return {
    grade,
    pattern,
  };
}

export function getCountdownVideoPath(step: CountdownStep): string {
  return buildCommonAssetPath('countdown', `cd_${step.color}_${step.number}.mp4`);
}
