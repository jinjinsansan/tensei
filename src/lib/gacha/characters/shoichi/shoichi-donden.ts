import type { DondenRoute } from '@/lib/gacha/common/types';

export const SHOICHI_DONDEN_ROUTES: DondenRoute[] = [
  { fromCardId: 'card01_fish', toCardId: 'card05_bear', steps: 2 },
  { fromCardId: 'card01_fish', toCardId: 'card07_beach_bar', steps: 2 },
  { fromCardId: 'card02_train', toCardId: 'card06_ikemen', steps: 2 },
  { fromCardId: 'card02_train', toCardId: 'card08_revenge_boss', steps: 2 },
  { fromCardId: 'card03_host', toCardId: 'card09_youth_love', steps: 2 },
  { fromCardId: 'card03_host', toCardId: 'card11_pilot', steps: 2 },
  { fromCardId: 'card04_rehire', toCardId: 'card08_revenge_boss', steps: 2 },
  { fromCardId: 'card05_bear', toCardId: 'card10_happy_family', steps: 2 },
  { fromCardId: 'card06_ikemen', toCardId: 'card11_pilot', steps: 2 },
  { fromCardId: 'card08_revenge_boss', toCardId: 'card12_investor', steps: 2 },
];
