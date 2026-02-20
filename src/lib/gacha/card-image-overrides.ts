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

const SHOICHI_CARD_IMAGE_OVERRIDES: Record<string, string> = {
  card01_fish: '/shoichi_cards_v2/shoichi_card01_fish.png',
  card02_train: '/shoichi_cards_v2/shoichi_card02_train.png',
  card03_host: '/shoichi_cards_v2/shoichi_card03_host.png',
  card04_rehire: '/shoichi_cards_v2/shoichi_card04_rehire.png',
  card05_bear: '/shoichi_cards_v2/shoichi_card05_bear.png',
  card06_ikemen: '/shoichi_cards_v2/shoichi_card06_ikemen.png',
  card07_beach_bar: '/shoichi_cards_v2/shoichi_card07_beach_bar.png',
  card08_revenge_boss: '/shoichi_cards_v2/shoichi_card08_revenge_boss.png',
  card09_youth_love: '/shoichi_cards_v2/shoichi_card09_youth_love.png',
  card10_happy_family: '/shoichi_cards_v2/shoichi_card10_happy_family.png',
  card11_pilot: '/shoichi_cards_v2/shoichi_card11_pilot.png',
  card12_investor: '/shoichi_cards_v2/shoichi_card12_investor.png',
};

const TATUMI_CARD_IMAGE_OVERRIDES: Record<string, string> = {
  card01_stone: '/tatumi_cards_v2/tatumi_card01.png',
  card02_bug: '/tatumi_cards_v2/tatumi_card02.png',
  card03_flower: '/tatumi_cards_v2/tatumi_card03.png',
  card04_prison: '/tatumi_cards_v2/tatumi_card04.png',
  card05_father: '/tatumi_cards_v2/tatumi_card05.png',
  card06_enma: '/tatumi_cards_v2/tatumi_card06.png',
  card07_detective: '/tatumi_cards_v2/tatumi_card07.png',
  card08_buddha: '/tatumi_cards_v2/tatumi_card08.png',
  card09_martial: '/tatumi_cards_v2/tatumi_card09.png',
  card10_actor: '/tatumi_cards_v2/tatumi_card10.png',
  card11_dragon: '/tatumi_cards_v2/tatumi_card11.png',
  card12_enma_true: '/tatumi_cards_v2/tatumi_card12.png',
};

const YAHEI_CARD_IMAGE_OVERRIDES: Record<string, string> = {
  card01_dinosaur: '/yahei_cards_v2/yahei_card01.png',
  card02_convenience: '/yahei_cards_v2/yahei_card02.png',
  card03_sns: '/yahei_cards_v2/yahei_card03.png',
  card04_rojyu: '/yahei_cards_v2/yahei_card04.png',
  card05_astronaut: '/yahei_cards_v2/yahei_card05.png',
  card06_noble: '/yahei_cards_v2/yahei_card06.png',
  card07_sushi: '/yahei_cards_v2/yahei_card07.png',
  card08_sumo: '/yahei_cards_v2/yahei_card08.png',
  card09_hollywood: '/yahei_cards_v2/yahei_card09.png',
  card10_shogun: '/yahei_cards_v2/yahei_card10.png',
  card11_president: '/yahei_cards_v2/yahei_card11.png',
  card12_timetravel: '/yahei_cards_v2/yahei_card12.png',
};

const CARD_IMAGE_OVERRIDES: Record<string, string> = {
  ...KENTA_CARD_IMAGE_OVERRIDES,
  ...SHOICHI_CARD_IMAGE_OVERRIDES,
  ...TATUMI_CARD_IMAGE_OVERRIDES,
  ...YAHEI_CARD_IMAGE_OVERRIDES,
};

const SERIAL_INSET_CARD_IDS = new Set(Object.keys(CARD_IMAGE_OVERRIDES));

export const SERIAL_OVERLAY_TOP_RATIO = 0.015;
export const SERIAL_OVERLAY_MIN_OFFSET_PX = 18;
export const SERIAL_OVERLAY_MAX_OFFSET_PX = 48;
export const SERIAL_OVERLAY_TOP_CSS = "clamp(0.7rem, 1.5vw, 1.25rem)";

export function getModuleCardImageOverride(moduleCardId: string | null | undefined): string | null {
  if (!moduleCardId) return null;
  return CARD_IMAGE_OVERRIDES[moduleCardId] ?? null;
}

export function getDbCardImageOverride(cardDbId: string | null | undefined): string | null {
  if (!cardDbId) return null;
  const moduleCardId = mapCardDbIdToModuleId(cardDbId);
  return getModuleCardImageOverride(moduleCardId);
}

export function shouldInsetSerialOverlay(moduleCardId: string | null | undefined): boolean {
  if (!moduleCardId) return false;
  return SERIAL_INSET_CARD_IDS.has(moduleCardId);
}

export {
  KENTA_CARD_IMAGE_OVERRIDES,
  SHOICHI_CARD_IMAGE_OVERRIDES,
  TATUMI_CARD_IMAGE_OVERRIDES,
  YAHEI_CARD_IMAGE_OVERRIDES,
  CARD_IMAGE_OVERRIDES,
};
