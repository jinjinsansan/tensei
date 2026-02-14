import { z } from 'zod';

import type { Tables } from '@/types/database';

const rtpSchema = z
  .array(
    z.object({
      star: z.number().int().min(1).max(12),
      probability: z.number().nonnegative(),
    }),
  )
  .nonempty();

const reversalSchema = z.record(z.number().min(0));

const characterWeightsSchema = z.array(
  z.object({
    characterId: z.string().uuid(),
    weight: z.number().nonnegative(),
  }),
);

export type RtpSlot = z.infer<typeof rtpSchema>[number];
export type ReversalRates = Record<number, number>;
export type CharacterWeight = z.infer<typeof characterWeightsSchema>[number];

export type ParsedGachaConfig = {
  id: string;
  slug: string;
  rtp: RtpSlot[];
  reversalRates: ReversalRates;
  characterWeights: CharacterWeight[];
  /** 0.0 - 1.0: プチュン無し(完全ハズレ)の確率 */
  lossRate: number;
};

export function parseGachaConfig(row: Tables<'gacha_config'>): ParsedGachaConfig {
  const rtp = rtpSchema.parse(row.rtp_config ?? []);

  const rawReversal = (row.reversal_rates ?? {}) as Record<string, unknown>;

  // lossRate は reversal_rates.lossRate に保存する（既存の星別リバーサル率とは分離）
  const rawLossRate = typeof rawReversal.lossRate === 'number' ? rawReversal.lossRate : undefined;

  const numericReversalSource: Record<string, number> = Object.fromEntries(
    Object.entries(rawReversal)
      .filter(([key, value]) => /^[0-9]+$/.test(key) && typeof value === 'number')
      .map(([key, value]) => [key, value as number]),
  );

  const reversalRates = reversalSchema.parse(numericReversalSource);
  const characterWeights = characterWeightsSchema.parse(row.character_weights ?? []);

  const normalizedReversalRates = Object.fromEntries(
    Object.entries(reversalRates).map(([star, rate]) => [Number(star), Math.max(0, Number(rate))]),
  );

  const lossRate = (() => {
    if (typeof rawLossRate === 'number' && Number.isFinite(rawLossRate)) {
      // 0.0〜1.0 にクランプ
      return Math.min(Math.max(rawLossRate, 0), 1);
    }
    // デフォルト: 60% ハズレ
    return 0.6;
  })();

  return {
    id: row.id,
    slug: row.slug,
    rtp,
    reversalRates: normalizedReversalRates,
    characterWeights,
    lossRate,
  };
}
