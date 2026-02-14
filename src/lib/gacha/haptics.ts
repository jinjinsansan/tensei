import type { CdColor } from '@/lib/gacha/common/types';

type PatternKey =
  | 'hint'
  | 'upgrade'
  | 'rainbow'
  | 'puchun'
  | 'donden'
  | 'card-low'
  | 'card-mid'
  | 'card-high';

const PATTERNS: Record<PatternKey, number | number[]> = {
  hint: [0, 25],
  upgrade: [0, 40, 20, 50],
  rainbow: [0, 90, 30, 140, 40, 200],
  puchun: [0, 60, 30, 140, 60, 220],
  donden: [0, 80, 30, 80, 30, 160, 40, 220],
  'card-low': 35,
  'card-mid': [0, 45, 25, 65],
  'card-high': [0, 80, 20, 120, 20, 180],
};

function vibrate(pattern: PatternKey) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  navigator.vibrate(PATTERNS[pattern]);
}

export function triggerCountdownUpgrade(prev: CdColor | null, next: CdColor | null) {
  if (!prev || !next || prev === next) return;
  if (prev === 'green' && next === 'blue') {
    vibrate('hint');
  } else if ((prev === 'green' || prev === 'blue') && next === 'red') {
    vibrate('upgrade');
  } else if (prev === 'red' && next === 'rainbow') {
    vibrate('rainbow');
  }
}

export function triggerPuchunVibration() {
  vibrate('puchun');
}

export function triggerDondenVibration() {
  vibrate('donden');
}

export function triggerCardRevealVibration(starRating: number) {
  if (starRating >= 11) {
    vibrate('card-high');
  } else if (starRating >= 9) {
    vibrate('card-mid');
  } else {
    vibrate('card-low');
  }
}
