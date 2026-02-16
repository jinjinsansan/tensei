"use client";

import { useEffect, useState } from 'react';

import type { Grade, Rarity, StandbyColor } from '@/lib/gacha/common/types';
import {
  GRADE_PROBABILITIES,
  STANDBY_PROBABILITIES,
  type ProbabilityRecord,
} from '@/lib/gacha/common/probabilities';

export type PresentationConfig = {
  standby: Record<Rarity, ProbabilityRecord<StandbyColor>>;
  countdown: Record<Rarity, ProbabilityRecord<Grade>>;
  titleHintRate: number;
};

const DEFAULT_CONFIG: PresentationConfig = {
  standby: STANDBY_PROBABILITIES,
  countdown: GRADE_PROBABILITIES,
  titleHintRate: 60,
};

export function usePresentationConfig(): PresentationConfig {
  const [config, setConfig] = useState<PresentationConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/gacha/presentation');
        if (!res.ok) return;
        const data = (await res.json()) as PresentationConfig;
        if (!cancelled && data && data.standby && data.countdown) {
          setConfig(data);
        }
      } catch {
        // 取得に失敗した場合はデフォルト設定のまま利用する
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return config;
}
