import type { DondenRoute } from '@/lib/gacha/common/types';

export const YAHEI_DONDEN_ROUTES: DondenRoute[] = [
  { fromCardId: 'card01_dinosaur', toCardId: 'card05_astronaut', steps: 2 },
  { fromCardId: 'card01_dinosaur', toCardId: 'card12_timetravel', steps: 2 },
  { fromCardId: 'card02_convenience', toCardId: 'card07_sushi', steps: 2 },
  { fromCardId: 'card02_convenience', toCardId: 'card09_hollywood', steps: 2 },
  { fromCardId: 'card03_sns', toCardId: 'card09_hollywood', steps: 2 },
  { fromCardId: 'card03_sns', toCardId: 'card11_president', steps: 2 },
  { fromCardId: 'card04_rojyu', toCardId: 'card10_shogun', steps: 2 },
  { fromCardId: 'card04_rojyu', toCardId: 'card12_timetravel', steps: 2 },
  { fromCardId: 'card06_noble', toCardId: 'card11_president', steps: 2 },
  { fromCardId: 'card08_sumo', toCardId: 'card12_timetravel', steps: 2 },
];
