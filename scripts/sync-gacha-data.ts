import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';

import { getServerEnv } from '@/lib/env';
import type { CharacterId, CharacterModule, DondenRoute } from '@/lib/gacha/common/types';
import { KENTA_CARDS, KENTA_CARD_DESCRIPTIONS } from '@/lib/gacha/characters/kenta/kenta-cards';
import { KENTA_DONDEN_ROUTES } from '@/lib/gacha/characters/kenta/kenta-donden';
import { KENTA_MODULE } from '@/lib/gacha/characters/kenta/kenta-module';
import { SHOICHI_CARDS, SHOICHI_CARD_DESCRIPTIONS } from '@/lib/gacha/characters/shoichi/shoichi-cards';
import { SHOICHI_DONDEN_ROUTES } from '@/lib/gacha/characters/shoichi/shoichi-donden';
import { SHOICHI_MODULE } from '@/lib/gacha/characters/shoichi/shoichi-module';
import { TATUMI_CARDS, TATUMI_CARD_DESCRIPTIONS } from '@/lib/gacha/characters/tatumi/tatumi-cards';
import { TATUMI_DONDEN_ROUTES } from '@/lib/gacha/characters/tatumi/tatumi-donden';
import { TATUMI_MODULE } from '@/lib/gacha/characters/tatumi/tatumi-module';
import {
  mapCardModuleIdToDbId,
  mapCharacterModuleIdToDbId,
} from '@/lib/gacha/characters/mapping';
import type { Database } from '@/types/database';

type DbClient = SupabaseClient<Database>;

function requireValue<T>(value: T | null | undefined, message: string): T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
  return value;
}

type CharacterSyncConfig = {
  module: CharacterModule;
  cards: typeof KENTA_CARDS;
  descriptions: Record<string, string>;
  dondenRoutes: DondenRoute[];
  profile: string;
  expectationLevel: number;
  sortOrder: number;
};

const CHARACTER_CONFIGS: Record<CharacterId, CharacterSyncConfig> = {
  kenta: {
    module: KENTA_MODULE,
    cards: KENTA_CARDS,
    descriptions: KENTA_CARD_DESCRIPTIONS,
    dondenRoutes: KENTA_DONDEN_ROUTES,
    profile: '健太モジュール（来世ガチャ）',
    expectationLevel: 2,
    sortOrder: 1,
  },
  shoichi: {
    module: SHOICHI_MODULE,
    cards: SHOICHI_CARDS,
    descriptions: SHOICHI_CARD_DESCRIPTIONS,
    dondenRoutes: SHOICHI_DONDEN_ROUTES,
    profile: '正一モジュール（来世ガチャ）',
    expectationLevel: 3,
    sortOrder: 2,
  },
  tatumi: {
    module: TATUMI_MODULE,
    cards: TATUMI_CARDS,
    descriptions: TATUMI_CARD_DESCRIPTIONS,
    dondenRoutes: TATUMI_DONDEN_ROUTES,
    profile: '辰巳剛モジュール（来世ガチャ）',
    expectationLevel: 4,
    sortOrder: 3,
  },
};

const targetCharacter = (process.argv[2] ?? 'kenta') as CharacterId;
if (!CHARACTER_CONFIGS[targetCharacter]) {
  console.error(`Unknown character: ${targetCharacter}. Supported: ${Object.keys(CHARACTER_CONFIGS).join(', ')}`);
  process.exit(1);
}

const { module: characterModule, cards: CHARACTER_CARDS, descriptions: CARD_DESCRIPTIONS, dondenRoutes: CHARACTER_DONDEN_ROUTES, profile: CHARACTER_PROFILE, expectationLevel: CHARACTER_EXPECTATION, sortOrder: CHARACTER_SORT_ORDER } = CHARACTER_CONFIGS[targetCharacter];

const CHARACTER_DB_ID = requireValue(
  mapCharacterModuleIdToDbId(targetCharacter),
  `${targetCharacter} character mapping is not configured.`,
);

const CARD_DB_ID_MAP: Record<string, string> = CHARACTER_CARDS.reduce((acc, card) => {
  const dbId = mapCardModuleIdToDbId(card.cardId);
  if (!dbId) {
    throw new Error(`Missing Supabase card ID mapping for ${card.cardId}`);
  }
  acc[card.cardId] = dbId;
  return acc;
}, {} as Record<string, string>);

const REVERSAL_TARGETS = new Set(CHARACTER_DONDEN_ROUTES.map((route) => route.toCardId));

async function upsertCharacter(client: DbClient) {
  const thumbnailCard = CHARACTER_CARDS[0];
  const thumbnail = thumbnailCard ? characterModule.getCardImagePath(thumbnailCard.cardId) : null;
  const payload = {
    id: CHARACTER_DB_ID,
    name: characterModule.characterName,
    description: CHARACTER_PROFILE,
    expectation_level: CHARACTER_EXPECTATION,
    thumbnail_url: thumbnail,
    is_active: true,
    sort_order: CHARACTER_SORT_ORDER,
    updated_at: new Date().toISOString(),
  };
  const { error } = await client.from('characters').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
  console.log('✔ characters upserted');
}

async function upsertCards(client: DbClient) {
  const payloads = CHARACTER_CARDS.map((card) => ({
    id: CARD_DB_ID_MAP[card.cardId],
    character_id: CHARACTER_DB_ID,
    card_name: card.name,
    star_level: card.starRating,
    rarity: card.rarity,
    card_image_url: characterModule.getCardImagePath(card.cardId),
    description: CARD_DESCRIPTIONS[card.cardId] ?? `${card.name} の章`,
    has_reversal: REVERSAL_TARGETS.has(card.cardId),
    is_active: true,
    sort_order: card.starRating,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await client.from('cards').upsert(payloads, { onConflict: 'id' });
  if (error) throw error;
  console.log('✔ cards upserted');
}

async function replacePreStories(client: DbClient) {
  const rows = characterModule.preScenePatterns.flatMap((pattern) =>
    Array.from({ length: pattern.steps }).map((_, idx) => ({
      id: stableUuid(`${targetCharacter}-pre-${pattern.patternId}-${idx + 1}`),
      character_id: CHARACTER_DB_ID,
      pattern: pattern.patternId,
      scene_order: idx + 1,
      video_url: characterModule.getPreSceneVideoPath(pattern.patternId, idx + 1),
      duration_seconds: 6,
      description: `転生前 ${pattern.patternId} / シーン${idx + 1}`,
    })),
  );

  const { error: deleteError } = await client.from('pre_stories').delete().eq('character_id', CHARACTER_DB_ID);
  if (deleteError) throw deleteError;
  if (rows.length) {
    const { error } = await client.from('pre_stories').insert(rows);
    if (error) throw error;
  }
  console.log('✔ pre_stories refreshed');
}

async function replaceChanceScenes(client: DbClient) {
  const rows = characterModule.chanceScenes.map((scene) => ({
    id: stableUuid(`${targetCharacter}-chance-${scene.patternId}`),
    character_id: CHARACTER_DB_ID,
    pattern: scene.patternId,
    video_url: characterModule.getChanceSceneVideoPath(scene.patternId),
    duration_seconds: 6,
    description: `転生チャンス ${scene.patternId}`,
  }));

  const { error: deleteError } = await client.from('chance_scenes').delete().eq('character_id', CHARACTER_DB_ID);
  if (deleteError) throw deleteError;
  if (rows.length) {
    const { error } = await client.from('chance_scenes').insert(rows);
    if (error) throw error;
  }
  console.log('✔ chance_scenes refreshed');
}

async function replaceScenarios(client: DbClient) {
  const mainRows = CHARACTER_CARDS.flatMap((card) =>
    Array.from({ length: card.mainSceneSteps }).map((_, idx) => ({
      id: stableUuid(`${targetCharacter}-main-${card.cardId}-${idx + 1}`),
      card_id: CARD_DB_ID_MAP[card.cardId],
      phase: 'main_story' as const,
      scene_order: idx + 1,
      video_url: characterModule.getMainSceneVideoPath(card.cardId, idx + 1),
      duration_seconds: 8,
      telop_text: `${card.name} シーン${idx + 1}`,
      telop_type: 'neutral' as const,
    })),
  );

  const reversalOrderOffsets: Record<string, number> = {};
  const reversalRows = CHARACTER_DONDEN_ROUTES.flatMap((route) => {
    const toCardDbId = CARD_DB_ID_MAP[route.toCardId];
    const offset = reversalOrderOffsets[toCardDbId] ?? 0;
    reversalOrderOffsets[toCardDbId] = offset + route.steps;
    return Array.from({ length: route.steps }).map((_, idx) => ({
      id: stableUuid(`${targetCharacter}-reversal-${route.fromCardId}-${route.toCardId}-${idx + 1}`),
      card_id: toCardDbId,
      phase: 'reversal' as const,
      scene_order: offset + idx + 1,
      video_url: characterModule.getDondenVideoPath(route.fromCardId, route.toCardId, idx + 1),
      duration_seconds: 7,
      telop_text: `どんでん返し ${route.fromCardId} → ${route.toCardId}`,
      telop_type: 'reversal' as const,
    }));
  });

  const allRows = [...mainRows, ...reversalRows];
  const cardIds = Object.values(CARD_DB_ID_MAP);
  for (const cardId of cardIds) {
    const { error: deleteError } = await client.from('scenarios').delete().eq('card_id', cardId);
    if (deleteError) throw deleteError;
  }
  if (allRows.length) {
    const { error } = await client.from('scenarios').insert(allRows);
    if (error) throw error;
  }
  console.log('✔ scenarios refreshed');
}

function stableUuid(value: string): string {
  const hash = createHash('sha1').update(value).digest();
  hash[6] = (hash[6] & 0x0f) | 0x50; // version 5
  hash[8] = (hash[8] & 0x3f) | 0x80; // variant RFC4122
  const hex = hash.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

async function main() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();
  const client = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  await upsertCharacter(client);
  await upsertCards(client);
  await replacePreStories(client);
  await replaceChanceScenes(client);
  await replaceScenarios(client);

  console.log(`🎉 Supabase gacha data synchronized for ${targetCharacter}.`);
}

main().catch((error) => {
  console.error('Failed to sync gacha data:', error);
  process.exitCode = 1;
});
