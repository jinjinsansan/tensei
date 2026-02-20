import { mapCardDbIdToModuleId } from '@/lib/gacha/characters/mapping';

const KENTA_CARD_IMAGE_OVERRIDES: Record<string, string> = {
  card01_convenience: '/kenta_cards_v2/kenta_card01_convenience.png',
  card02_warehouse: '/kenta_cards_v2/kenta_card02_warehouse.png',
  card03_youtuber: '/kenta_cards_v2/kenta_card03_youtuber.png',
  card04_civil_servant: '/kenta_cards_v2/kenta_card04_civil_servant.png',
  card05_ramen: '/kenta_cards_v2/kenta_card05_ramen.png',
  card06_boxer: '/kenta_cards_v2/kenta_card06_boxer.png',
  card07_surgeon: '/kenta_cards_v2/kenta_card07_surgeon.png',
  card08_business_owner: '/kenta_cards_v2/kenta_card08_business.png',
  card09_mercenary: '/kenta_cards_v2/kenta_card09_mercenary.png',
  card10_rockstar: '/kenta_cards_v2/kenta_card10_rockstar.png',
  card11_demon_king: '/kenta_cards_v2/kenta_card11_demon_lord.png',
  card12_hero: '/kenta_cards_v2/kenta_card12_hero.png',
};

export function getModuleCardImageOverride(moduleCardId: string | null | undefined): string | null {
  if (!moduleCardId) return null;
  return KENTA_CARD_IMAGE_OVERRIDES[moduleCardId] ?? null;
}

export function getDbCardImageOverride(cardDbId: string | null | undefined): string | null {
  if (!cardDbId) return null;
  const moduleCardId = mapCardDbIdToModuleId(cardDbId);
  return getModuleCardImageOverride(moduleCardId);
}

export { KENTA_CARD_IMAGE_OVERRIDES };
