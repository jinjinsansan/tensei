import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';

import { getServerEnv } from '@/lib/env';
import { KENTA_CARDS, KENTA_CARD_DESCRIPTIONS } from '@/lib/gacha/characters/kenta/kenta-cards';
import { KENTA_DONDEN_ROUTES } from '@/lib/gacha/characters/kenta/kenta-donden';
import { KENTA_MODULE } from '@/lib/gacha/characters/kenta/kenta-module';
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

const CHARACTER_DB_ID = requireValue(mapCharacterModuleIdToDbId('kenta'), 'Kenta character mapping is not configured.');

const CARD_DB_ID_MAP: Record<string, string> = KENTA_CARDS.reduce((acc, card) => {
  const dbId = mapCardModuleIdToDbId(card.cardId);
  if (!dbId) {
    throw new Error(`Missing Supabase card ID mapping for ${card.cardId}`);
  }
  acc[card.cardId] = dbId;
  return acc;
}, {} as Record<string, string>);

const REVERSAL_TARGETS = new Set(KENTA_DONDEN_ROUTES.map((route) => route.toCardId));

async function upsertCharacter(client: DbClient) {
  const thumbnailCard = KENTA_CARDS[0];
  const thumbnail = thumbnailCard ? KENTA_MODULE.getCardImagePath(thumbnailCard.cardId) : null;
  const payload = {
    id: CHARACTER_DB_ID,
    name: KENTA_MODULE.characterName,
    description: '健太モジュール（来世ガチャ）',
    expectation_level: 2,
    thumbnail_url: thumbnail,
    is_active: true,
    sort_order: 1,
    updated_at: new Date().toISOString(),
  };
  const { error } = await client.from('characters').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
  console.log('✔ characters upserted');
}

async function upsertCards(client: DbClient) {
  const payloads = KENTA_CARDS.map((card) => ({
    id: CARD_DB_ID_MAP[card.cardId],
    character_id: CHARACTER_DB_ID,
    card_name: card.name,
    star_level: card.starRating,
    rarity: card.rarity,
    card_image_url: KENTA_MODULE.getCardImagePath(card.cardId),
    description: KENTA_CARD_DESCRIPTIONS[card.cardId] ?? `${card.name} の章`,
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
  const rows = KENTA_MODULE.preScenePatterns.flatMap((pattern) =>
    Array.from({ length: pattern.steps }).map((_, idx) => ({
      id: stableUuid(`kenta-pre-${pattern.patternId}-${idx + 1}`),
      character_id: CHARACTER_DB_ID,
      pattern: pattern.patternId,
      scene_order: idx + 1,
      video_url: KENTA_MODULE.getPreSceneVideoPath(pattern.patternId, idx + 1),
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
  const rows = KENTA_MODULE.chanceScenes.map((scene) => ({
    id: stableUuid(`kenta-chance-${scene.patternId}`),
    character_id: CHARACTER_DB_ID,
    pattern: scene.patternId,
    video_url: KENTA_MODULE.getChanceSceneVideoPath(scene.patternId),
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
  const mainRows = KENTA_CARDS.flatMap((card) =>
    Array.from({ length: card.mainSceneSteps }).map((_, idx) => ({
      id: stableUuid(`kenta-main-${card.cardId}-${idx + 1}`),
      card_id: CARD_DB_ID_MAP[card.cardId],
      phase: 'main_story' as const,
      scene_order: idx + 1,
      video_url: KENTA_MODULE.getMainSceneVideoPath(card.cardId, idx + 1),
      duration_seconds: 8,
      telop_text: `${card.name} シーン${idx + 1}`,
      telop_type: 'neutral' as const,
    })),
  );

  const reversalOrderOffsets: Record<string, number> = {};
  const reversalRows = KENTA_DONDEN_ROUTES.flatMap((route) => {
    const toCardDbId = CARD_DB_ID_MAP[route.toCardId];
    const offset = reversalOrderOffsets[toCardDbId] ?? 0;
    reversalOrderOffsets[toCardDbId] = offset + route.steps;
    return Array.from({ length: route.steps }).map((_, idx) => ({
      id: stableUuid(`kenta-reversal-${route.fromCardId}-${route.toCardId}-${idx + 1}`),
      card_id: toCardDbId,
      phase: 'reversal' as const,
      scene_order: offset + idx + 1,
      video_url: KENTA_MODULE.getDondenVideoPath(route.fromCardId, route.toCardId, idx + 1),
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

  console.log('🎉 Supabase gacha data synchronized.');
}

main().catch((error) => {
  console.error('Failed to sync gacha data:', error);
  process.exitCode = 1;
});
