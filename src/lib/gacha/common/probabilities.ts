import type { Grade, Rarity, StandbyColor } from '@/lib/gacha/common/types';

export type ProbabilityRecord<T extends string> = Record<T, number>;

const DEFAULT_TOTAL = 100;

export function pickByProbability<T extends string>(table: ProbabilityRecord<T>): T {
  const entries = Object.entries(table) as [T, number][];
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0) || DEFAULT_TOTAL;
  const roll = Math.random() * total;
  let cumulative = 0;
  for (const [value, weight] of entries) {
    cumulative += weight;
    if (roll <= cumulative) {
      return value;
    }
  }
  return entries[entries.length - 1]?.[0];
}

export const STANDBY_PROBABILITIES: Record<Rarity, ProbabilityRecord<StandbyColor>> = {
  N: { black: 45, white: 25, yellow: 15, blue: 10, red: 4, rainbow: 1 },
  R: { black: 20, white: 30, yellow: 25, blue: 15, red: 8, rainbow: 2 },
  SR: { black: 10, white: 15, yellow: 30, blue: 25, red: 15, rainbow: 5 },
  SSR: { black: 5, white: 10, yellow: 15, blue: 30, red: 30, rainbow: 10 },
  UR: { black: 3, white: 5, yellow: 10, blue: 20, red: 40, rainbow: 22 },
  LR: { black: 2, white: 3, yellow: 5, blue: 10, red: 35, rainbow: 45 },
};

export const GRADE_PROBABILITIES: Record<Rarity, ProbabilityRecord<Grade>> = {
  N: { E1: 55, E2: 25, E3: 12, E4: 6, E5: 2 },
  R: { E1: 30, E2: 40, E3: 20, E4: 8, E5: 2 },
  SR: { E1: 15, E2: 25, E3: 35, E4: 20, E5: 5 },
  SSR: { E1: 8, E2: 15, E3: 25, E4: 40, E5: 12 },
  UR: { E1: 5, E2: 10, E3: 15, E4: 45, E5: 25 },
  LR: { E1: 3, E2: 7, E3: 10, E4: 35, E5: 45 },
};

export function selectStandbyColor(
  rarity: Rarity,
  override?: Record<Rarity, ProbabilityRecord<StandbyColor>>,
): StandbyColor {
  const table = override ?? STANDBY_PROBABILITIES;
  return pickByProbability(table[rarity]);
}

export function selectCountdownGrade(
  rarity: Rarity,
  override?: Record<Rarity, ProbabilityRecord<Grade>>,
): Grade {
  const table = override ?? GRADE_PROBABILITIES;
  return pickByProbability(table[rarity]);
}

export function selectByWeights(weights: number[], offset = 0): number {
  if (!weights.length) return offset;
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const roll = Math.random() * total;
  let cumulative = 0;
  for (let i = 0; i < weights.length; i += 1) {
    cumulative += weights[i];
    if (roll <= cumulative) {
      return offset + i;
    }
  }
  return offset + weights.length - 1;
}
