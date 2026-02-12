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
};

export function parseGachaConfig(row: Tables<'gacha_config'>): ParsedGachaConfig {
  const rtp = rtpSchema.parse(row.rtp_config ?? []);
  const reversalRates = reversalSchema.parse(row.reversal_rates ?? {});
  const characterWeights = characterWeightsSchema.parse(row.character_weights ?? []);

  const normalizedReversalRates = Object.fromEntries(
    Object.entries(reversalRates).map(([star, rate]) => [Number(star), Math.max(0, Number(rate))]),
  );

  return {
    id: row.id,
    slug: row.slug,
    rtp,
    reversalRates: normalizedReversalRates,
    characterWeights,
  };
}
