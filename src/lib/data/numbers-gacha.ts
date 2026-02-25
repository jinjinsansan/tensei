import type { SupabaseClient } from '@supabase/supabase-js';

import { withSanitizedScenarios, DEFAULT_NUMBERS_SCENARIOS } from '@/lib/numbers-gacha/default-scenarios';
import type { NumbersResultType, NumbersScenario, NumbersSettings, NumbersStep } from '@/lib/numbers-gacha/types';
import type { Database, Tables } from '@/types/database';

const SETTINGS_ID = '00000000-0000-0000-0000-000000000003';

const DEFAULT_STAR_DISTRIBUTION = [15, 13, 12, 11, 10, 9, 8, 7, 5, 4, 4, 2];

function normalizeStarDistribution(value: unknown): number[] {
  if (!Array.isArray(value) || value.length !== 12) return [...DEFAULT_STAR_DISTRIBUTION];
  const parsed = value.map((v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  });
  return parsed.every((n) => Number.isFinite(n)) ? parsed : [...DEFAULT_STAR_DISTRIBUTION];
}

type SettingsRow = Tables<'numbers_gacha_settings'>;

export async function fetchNumbersGachaSettings(client: SupabaseClient<Database>): Promise<NumbersSettings> {
  const { data } = await client
    .from('numbers_gacha_settings' as never)
    .select('*')
    .eq('id', SETTINGS_ID)
    .maybeSingle();

  if (!data) {
    return {
      id: SETTINGS_ID,
      isActive: true,
      lossRate: 60,
      starDistribution: [...DEFAULT_STAR_DISTRIBUTION],
      earlyMissEnabled: true,
      earlyMissMinCount: 3,
      revivalRate: 5,
      demotionEnabled: true,
      maxPromotions: 4,
    };
  }

  const row = data as SettingsRow;

  return {
    id: String(row.id ?? SETTINGS_ID),
    isActive: Boolean(row.is_active ?? true),
    lossRate: Number(row.loss_rate ?? 60),
    starDistribution: normalizeStarDistribution(row.star_distribution),
    earlyMissEnabled: Boolean(row.early_miss_enabled ?? true),
    earlyMissMinCount: Number(row.early_miss_min_count ?? 3),
    revivalRate: Number(row.revival_rate ?? 5),
    demotionEnabled: Boolean(row.demotion_enabled ?? true),
    maxPromotions: Number(row.max_promotions ?? 4),
  };
}

export async function upsertNumbersGachaSettings(
  client: SupabaseClient<Database>,
  payload: Partial<NumbersSettings>,
): Promise<void> {
  const patch: Record<string, unknown> = {
    id: SETTINGS_ID,
    updated_at: new Date().toISOString(),
  };

  if (payload.isActive !== undefined) patch.is_active = payload.isActive;
  if (payload.lossRate !== undefined) patch.loss_rate = payload.lossRate;
  if (payload.starDistribution !== undefined) patch.star_distribution = payload.starDistribution;
  if (payload.earlyMissEnabled !== undefined) patch.early_miss_enabled = payload.earlyMissEnabled;
  if (payload.earlyMissMinCount !== undefined) patch.early_miss_min_count = payload.earlyMissMinCount;
  if (payload.revivalRate !== undefined) patch.revival_rate = payload.revivalRate;
  if (payload.demotionEnabled !== undefined) patch.demotion_enabled = payload.demotionEnabled;
  if (payload.maxPromotions !== undefined) patch.max_promotions = payload.maxPromotions;

  await (client.from('numbers_gacha_settings' as never) as ReturnType<typeof client.from>)
    .upsert(patch as never, { onConflict: 'id' } as never);
}

function toScenarioRow(entry: NumbersScenario) {
  return {
    scenario_code: entry.code,
    label: entry.label,
    description: entry.description ?? null,
    result_type: entry.resultType,
    sequence: entry.sequence,
    final_stage: entry.finalStage,
    weight: entry.weight ?? 10,
    is_active: entry.isActive ?? true,
    is_custom: entry.isCustom ?? false,
  };
}

export async function seedDefaultNumbersScenarios(
  client: SupabaseClient<Database>,
  force = false,
): Promise<number> {
  if (!force) {
    const { data: existing } = await client
      .from('numbers_gacha_scenarios' as never)
      .select('id')
      .limit(1);
    if (existing && existing.length > 0) return 0;
  } else {
    // 既存の非カスタムシナリオを全削除して再投入
    await (client.from('numbers_gacha_scenarios' as never) as ReturnType<typeof client.from>)
      .delete()
      .eq('is_custom', false as never);
  }

  const payload = withSanitizedScenarios(DEFAULT_NUMBERS_SCENARIOS).map(toScenarioRow);
  const { error } = await (client.from('numbers_gacha_scenarios' as never) as ReturnType<typeof client.from>)
    .insert(payload as never);
  if (error) throw error;
  return payload.length;
}

export type ScenarioFilters = {
  includeInactive?: boolean;
  resultType?: NumbersResultType;
};

type ScenarioRow = Tables<'numbers_gacha_scenarios'>;

export async function fetchNumbersScenarios(
  client: SupabaseClient<Database>,
  filters: ScenarioFilters = {},
): Promise<NumbersScenario[]> {
  const query = client.from('numbers_gacha_scenarios' as never).select('*');
  if (!filters.includeInactive) {
    query.eq('is_active', true as never);
  }
  if (filters.resultType) {
    query.eq('result_type', filters.resultType as never);
  }
  const { data } = await query.order('scenario_code', { ascending: true } as never);
  const list = (data ?? []) as ScenarioRow[];
  return list.map((row) => ({
    id: row.id,
    code: row.scenario_code,
    label: row.label,
    description: row.description ?? undefined,
    resultType: row.result_type as NumbersResultType,
    sequence: row.sequence as NumbersStep[],
    finalStage: (row.final_stage ?? 'first') as NumbersScenario['finalStage'],
    weight: Number(row.weight ?? 10),
    isActive: Boolean(row.is_active ?? true),
    isCustom: Boolean(row.is_custom ?? false),
  }));

}

export function chooseNumbersResultType(settings: NumbersSettings): NumbersResultType {
  const lossRoll = Math.random() * 100;
  if (lossRoll < settings.lossRate) return 'miss';

  const dist = settings.starDistribution ?? [...DEFAULT_STAR_DISTRIBUTION];
  const total = dist.reduce((s, v) => s + v, 0) || 1;
  const roll = Math.random() * total;
  let acc = 0;
  for (let i = 0; i < dist.length; i += 1) {
    acc += dist[i];
    if (roll <= acc) {
      return (`star${i + 1}`) as NumbersResultType;
    }
  }
  return 'star12';
}

export function chooseScenarioByResultType(
  scenarios: NumbersScenario[],
  resultType: NumbersResultType,
): NumbersScenario | null {
  const candidates = scenarios.filter((s) => s.resultType === resultType && (s.isActive ?? true));
  if (candidates.length === 0) return null;
  const totalWeight = candidates.reduce((s, c) => s + (c.weight ?? 10), 0) || candidates.length;
  const roll = Math.random() * totalWeight;
  let acc = 0;
  for (const c of candidates) {
    acc += c.weight ?? 10;
    if (roll <= acc) return c;
  }
  return candidates[0];
}

export async function recordNumbersResult(
  client: SupabaseClient<Database>,
  payload: {
    userId?: string | null;
    sessionId?: string | null;
    resultType: NumbersResultType;
    scenarioId?: string | null;
    scenarioCode?: string | null;
    finalStage?: string | null;
    puchunTriggered?: boolean;
    revivalTriggered?: boolean;
    totalVideoCount?: number;
  },
): Promise<string> {
  const insertPayload = {
    user_id: payload.userId ?? null,
    session_id: payload.sessionId ?? null,
    result_type: payload.resultType,
    scenario_id: payload.scenarioId ?? null,
    scenario_code: payload.scenarioCode ?? null,
    final_stage: payload.finalStage ?? null,
    puchun_triggered: payload.puchunTriggered ?? null,
    revival_triggered: payload.revivalTriggered ?? null,
    total_video_count: payload.totalVideoCount ?? null,
  };

  const { data, error } = await (client.from('numbers_gacha_results' as never) as ReturnType<typeof client.from>)
    .insert(insertPayload as never)
    .select('id')
    .single();
  if (error) throw error;
  return (data as Tables<'numbers_gacha_results'>).id;
}

export type NumbersDraw = {
  settings: NumbersSettings;
  scenario: NumbersScenario;
  resultType: NumbersResultType;
};

export async function prepareNumbersDraw(client: SupabaseClient<Database>): Promise<NumbersDraw> {
  const settings = await fetchNumbersGachaSettings(client);
  let scenarios = await fetchNumbersScenarios(client, { includeInactive: false });
  if (!scenarios.length) {
    await seedDefaultNumbersScenarios(client);
    scenarios = await fetchNumbersScenarios(client, { includeInactive: false });
  }

  const resultType = chooseNumbersResultType(settings);
  const picked = chooseScenarioByResultType(scenarios, resultType) ?? scenarios[0];
  return {
    settings,
    scenario: picked,
    resultType,
  };
}
