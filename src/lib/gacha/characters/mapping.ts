const CHARACTER_DB_TO_MODULE_ID: Record<string, string> = {
  '11111111-1111-4111-8111-111111111111': 'kenta',
  '11111111-1111-4111-8111-111111111112': 'shoichi',
};

const CHARACTER_MODULE_TO_DB_ID = Object.fromEntries(
  Object.entries(CHARACTER_DB_TO_MODULE_ID).map(([dbId, moduleId]) => [moduleId, dbId]),
);

const CARD_DB_TO_MODULE_ID: Record<string, string> = {
  // 健太
  '22222222-1111-4111-8111-111111111111': 'card01_convenience',
  '22222222-1111-4111-8111-111111111112': 'card02_warehouse',
  '22222222-1111-4111-8111-111111111113': 'card03_youtuber',
  '22222222-1111-4111-8111-111111111114': 'card04_civil_servant',
  '22222222-1111-4111-8111-111111111115': 'card05_ramen',
  '22222222-1111-4111-8111-111111111116': 'card06_boxer',
  '22222222-1111-4111-8111-111111111117': 'card07_surgeon',
  '22222222-1111-4111-8111-111111111118': 'card08_business_owner',
  '22222222-1111-4111-8111-111111111119': 'card09_mercenary',
  '22222222-1111-4111-8111-111111111120': 'card10_rockstar',
  '22222222-1111-4111-8111-111111111121': 'card11_demon_king',
  '22222222-1111-4111-8111-111111111122': 'card12_hero',
  // 昭一
  '33333333-1111-4111-8111-333333333331': 'card01_fish',
  '33333333-1111-4111-8111-333333333332': 'card02_train',
  '33333333-1111-4111-8111-333333333333': 'card03_host',
  '33333333-1111-4111-8111-333333333334': 'card04_rehire',
  '33333333-1111-4111-8111-333333333335': 'card05_bear',
  '33333333-1111-4111-8111-333333333336': 'card06_ikemen',
  '33333333-1111-4111-8111-333333333337': 'card07_beach_bar',
  '33333333-1111-4111-8111-333333333338': 'card08_revenge_boss',
  '33333333-1111-4111-8111-333333333339': 'card09_youth_love',
  '33333333-1111-4111-8111-333333333340': 'card10_happy_family',
  '33333333-1111-4111-8111-333333333341': 'card11_pilot',
  '33333333-1111-4111-8111-333333333342': 'card12_investor',
};

const CARD_MODULE_TO_DB_ID = Object.fromEntries(
  Object.entries(CARD_DB_TO_MODULE_ID).map(([dbId, moduleId]) => [moduleId, dbId]),
);

export function mapCharacterDbIdToModuleId(dbId: string | null | undefined): string | null {
  if (!dbId) return null;
  return CHARACTER_DB_TO_MODULE_ID[dbId] ?? null;
}

export function mapCharacterModuleIdToDbId(moduleId: string | null | undefined): string | null {
  if (!moduleId) return null;
  return CHARACTER_MODULE_TO_DB_ID[moduleId] ?? null;
}

export function mapCardDbIdToModuleId(dbId: string | null | undefined): string | null {
  if (!dbId) return null;
  return CARD_DB_TO_MODULE_ID[dbId] ?? null;
}

export function mapCardModuleIdToDbId(moduleId: string | null | undefined): string | null {
  if (!moduleId) return null;
  return CARD_MODULE_TO_DB_ID[moduleId] ?? null;
}
