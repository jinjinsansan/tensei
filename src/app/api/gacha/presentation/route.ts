import { NextResponse } from 'next/server';

import { getServiceSupabase } from '@/lib/supabase/service';
import type { Tables } from '@/types/database';
import type { Grade, Rarity, StandbyColor } from '@/lib/gacha/common/types';
import {
  GRADE_PROBABILITIES,
  STANDBY_PROBABILITIES,
  type ProbabilityRecord,
} from '@/lib/gacha/common/probabilities';

type PresentationConfigResponse = {
  standby: Record<Rarity, ProbabilityRecord<StandbyColor>>;
  countdown: Record<Rarity, ProbabilityRecord<Grade>>;
  titleHintRate: number;
};

const RARITIES: Rarity[] = ['N', 'R', 'SR', 'SSR', 'UR', 'LR'];
const STANDBY_COLORS: StandbyColor[] = ['black', 'white', 'yellow', 'red', 'blue', 'rainbow'];
const GRADES: Grade[] = ['E1', 'E2', 'E3', 'E4', 'E5'];

export async function GET() {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase.from('presentation_config').select('*');
    if (error) {
      console.error('presentation_config load error', error);
    }

    const rows = (data ?? []) as Tables<'presentation_config'>[];

    // デフォルト値で初期化
    const standby: PresentationConfigResponse['standby'] = { ...STANDBY_PROBABILITIES };
    const countdown: PresentationConfigResponse['countdown'] = { ...GRADE_PROBABILITIES };
    let titleHintRate = 60;

    for (const row of rows) {
      if (row.config_type === 'standby_color') {
        const rarity = row.rarity as Rarity;
        if (!RARITIES.includes(rarity)) continue;
        if (typeof row.probabilities !== 'object' || row.probabilities === null) continue;
        const probs = row.probabilities as Record<string, number>;
        const table: ProbabilityRecord<StandbyColor> = { ...standby[rarity] };
        for (const color of STANDBY_COLORS) {
          const value = Number(probs[color]);
          if (Number.isFinite(value)) {
            table[color] = value;
          }
        }
        standby[rarity] = table;
      } else if (row.config_type === 'countdown_grade') {
        const rarity = row.rarity as Rarity;
        if (!RARITIES.includes(rarity)) continue;
        if (typeof row.probabilities !== 'object' || row.probabilities === null) continue;
        const probs = row.probabilities as Record<string, number>;
        const table: ProbabilityRecord<Grade> = { ...countdown[rarity] };
        for (const grade of GRADES) {
          const value = Number(probs[grade]);
          if (Number.isFinite(value)) {
            table[grade] = value;
          }
        }
        countdown[rarity] = table;
      } else if (row.config_type === 'title_hint') {
        if (typeof row.probabilities !== 'object' || row.probabilities === null) continue;
        const probs = row.probabilities as { hintRate?: number };
        const value = Number(probs.hintRate);
        if (Number.isFinite(value)) {
          titleHintRate = Math.min(Math.max(value, 0), 100);
        }
      }
    }

    const response: PresentationConfigResponse = {
      standby,
      countdown,
      titleHintRate,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('/api/gacha/presentation error', error);
    // 失敗時はデフォルト設定を返す
    return NextResponse.json(
      {
        standby: STANDBY_PROBABILITIES,
        countdown: GRADE_PROBABILITIES,
        titleHintRate: 60,
      } satisfies PresentationConfigResponse,
      { status: 200 },
    );
  }
}
