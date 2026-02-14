import type { DondenRoute } from '@/lib/gacha/common/types';

export const KENTA_DONDEN_ROUTES: DondenRoute[] = [
  { fromCardId: 'card01_convenience', toCardId: 'card05_ramen', steps: 2 },
  { fromCardId: 'card01_convenience', toCardId: 'card07_surgeon', steps: 2 },
  { fromCardId: 'card02_warehouse', toCardId: 'card06_boxer', steps: 2 },
  { fromCardId: 'card02_warehouse', toCardId: 'card08_business_owner', steps: 2 },
  { fromCardId: 'card03_youtuber', toCardId: 'card10_rockstar', steps: 2 },
  { fromCardId: 'card04_civil_servant', toCardId: 'card09_mercenary', steps: 2 },
  { fromCardId: 'card05_ramen', toCardId: 'card08_business_owner', steps: 2 },
  { fromCardId: 'card06_boxer', toCardId: 'card09_mercenary', steps: 2 },
  { fromCardId: 'card07_surgeon', toCardId: 'card11_demon_king', steps: 2 },
  { fromCardId: 'card08_business_owner', toCardId: 'card12_hero', steps: 2 },
];
