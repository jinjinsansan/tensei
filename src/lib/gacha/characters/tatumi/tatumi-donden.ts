import type { DondenRoute } from '@/lib/gacha/common/types';

export const TATUMI_DONDEN_ROUTES: DondenRoute[] = [
  { fromCardId: 'card01_stone', toCardId: 'card05_father', steps: 2 },
  { fromCardId: 'card01_stone', toCardId: 'card08_buddha', steps: 2 },
  { fromCardId: 'card02_bug', toCardId: 'card06_enma', steps: 2 },
  { fromCardId: 'card02_bug', toCardId: 'card11_dragon', steps: 2 },
  { fromCardId: 'card03_flower', toCardId: 'card08_buddha', steps: 2 },
  { fromCardId: 'card03_flower', toCardId: 'card09_martial', steps: 2 },
  { fromCardId: 'card04_prison', toCardId: 'card07_detective', steps: 2 },
  { fromCardId: 'card04_prison', toCardId: 'card10_actor', steps: 2 },
  { fromCardId: 'card06_enma', toCardId: 'card12_enma_true', steps: 2 },
  { fromCardId: 'card09_martial', toCardId: 'card12_enma_true', steps: 2 },
];
