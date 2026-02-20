const CHARACTER_DB_TO_MODULE_ID: Record<string, string> = {
  '11111111-1111-4111-8111-111111111111': 'kenta',
  '11111111-1111-4111-8111-111111111112': 'shoichi',
  '11111111-1111-4111-8111-111111111113': 'tatumi',
  '11111111-1111-4111-8111-111111111114': 'yahei',
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
  // 正一
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
  // 辰巳
  '44444444-1111-4111-8111-444444444441': 'card01_stone',
  '44444444-1111-4111-8111-444444444442': 'card02_bug',
  '44444444-1111-4111-8111-444444444443': 'card03_flower',
  '44444444-1111-4111-8111-444444444444': 'card04_prison',
  '44444444-1111-4111-8111-444444444445': 'card05_father',
  '44444444-1111-4111-8111-444444444446': 'card06_enma',
  '44444444-1111-4111-8111-444444444447': 'card07_detective',
  '44444444-1111-4111-8111-444444444448': 'card08_buddha',
  '44444444-1111-4111-8111-444444444449': 'card09_martial',
  '44444444-1111-4111-8111-444444444450': 'card10_actor',
  '44444444-1111-4111-8111-444444444451': 'card11_dragon',
  '44444444-1111-4111-8111-444444444452': 'card12_enma_true',
  // 弥平
  '55555555-1111-4111-8111-555555555551': 'card01_dinosaur',
  '55555555-1111-4111-8111-555555555552': 'card02_convenience',
  '55555555-1111-4111-8111-555555555553': 'card03_sns',
  '55555555-1111-4111-8111-555555555554': 'card04_rojyu',
  '55555555-1111-4111-8111-555555555555': 'card05_astronaut',
  '55555555-1111-4111-8111-555555555556': 'card06_noble',
  '55555555-1111-4111-8111-555555555557': 'card07_sushi',
  '55555555-1111-4111-8111-555555555558': 'card08_sumo',
  '55555555-1111-4111-8111-555555555559': 'card09_hollywood',
  '55555555-1111-4111-8111-555555555560': 'card10_shogun',
  '55555555-1111-4111-8111-555555555561': 'card11_president',
  '55555555-1111-4111-8111-555555555562': 'card12_timetravel',
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
