import type { DondenRoute } from '@/lib/gacha/common/types';

export const REIKO_DONDEN_ROUTES: DondenRoute[] = [
  { fromCardId: 'reiko_card01', toCardId: 'reiko_card05', steps: 2 },
  { fromCardId: 'reiko_card01', toCardId: 'reiko_card07', steps: 2 },
  { fromCardId: 'reiko_card02', toCardId: 'reiko_card06', steps: 2 },
  { fromCardId: 'reiko_card02', toCardId: 'reiko_card08', steps: 2 },
  { fromCardId: 'reiko_card03', toCardId: 'reiko_card09', steps: 2 },
  { fromCardId: 'reiko_card03', toCardId: 'reiko_card11', steps: 2 },
  { fromCardId: 'reiko_card04', toCardId: 'reiko_card10', steps: 2 },
  { fromCardId: 'reiko_card04', toCardId: 'reiko_card12', steps: 2 },
  { fromCardId: 'reiko_card05', toCardId: 'reiko_card11', steps: 2 },
  { fromCardId: 'reiko_card06', toCardId: 'reiko_card12', steps: 2 },
];
