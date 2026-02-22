import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export type BattleGachaSettings = {
  id: string;
  isEnabled: boolean;
  lossRate: number;
  reversalRate: number;
  dondenRate: number;
  starDistribution: number[]; // length 12, sum ~100
};

const BATTLE_SETTINGS_ID = '00000000-0000-0000-0000-000000000002';

export const DEFAULT_BATTLE_STAR_DISTRIBUTION: number[] = [
  20, 20, 15, 15, 7.5, 7.5, 4.5, 4.5, 2, 2, 1, 1,
];

function parseStarDistribution(value: unknown): number[] {
  if (!Array.isArray(value)) return [...DEFAULT_BATTLE_STAR_DISTRIBUTION];
  if (value.length !== 12) return [...DEFAULT_BATTLE_STAR_DISTRIBUTION];
  const nums = value.map((v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  });
  return nums;
}

export async function fetchBattleGachaSettings(
  client: SupabaseClient<Database>,
): Promise<BattleGachaSettings> {
  const { data } = await client
    .from('battle_gacha_settings' as never)
    .select('*')
    .eq('id', BATTLE_SETTINGS_ID)
    .maybeSingle();

  if (!data) {
    return {
      id: BATTLE_SETTINGS_ID,
      isEnabled: false,
      lossRate: 60,
      reversalRate: 15,
      dondenRate: 15,
      starDistribution: [...DEFAULT_BATTLE_STAR_DISTRIBUTION],
    };
  }

  const row = data as Record<string, unknown>;
  return {
    id: String(row.id ?? BATTLE_SETTINGS_ID),
    isEnabled: Boolean(row.is_enabled),
    lossRate: Number(row.loss_rate ?? 60),
    reversalRate: Number(row.reversal_rate ?? 15),
    dondenRate: Number(row.donden_rate ?? 15),
    starDistribution: parseStarDistribution(row.star_distribution),
  };
}

export async function updateBattleGachaSettings(
  client: SupabaseClient<Database>,
  updates: Partial<Omit<BattleGachaSettings, 'id'>>,
): Promise<void> {
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.isEnabled !== undefined) patch.is_enabled = updates.isEnabled;
  if (updates.lossRate !== undefined) patch.loss_rate = updates.lossRate;
  if (updates.reversalRate !== undefined) patch.reversal_rate = updates.reversalRate;
  if (updates.dondenRate !== undefined) patch.donden_rate = updates.dondenRate;
  if (updates.starDistribution !== undefined) patch.star_distribution = updates.starDistribution;

  await (client.from('battle_gacha_settings' as never) as ReturnType<typeof client.from>)
    .update(patch as never)
    .eq('id', BATTLE_SETTINGS_ID);
}
