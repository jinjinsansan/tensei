import { randomFloat, pickRandom, pickByWeight } from '@/lib/utils/random';
import { getServiceSupabase } from '@/lib/supabase/service';
import {
  fetchActiveCharacters,
  fetchCardsByCharacter,
  fetchChanceScenes,
  fetchGachaConfig,
  fetchPreStories,
  fetchScenarios,
  insertGachaResult,
  insertGachaHistory,
} from '@/lib/data/gacha';
import { drawStar } from '@/lib/gacha/rtp';
import type { CharacterWeight } from '@/lib/gacha/config';
import type { StoryPayload, VideoSegment, GachaEngineResult } from '@/lib/gacha/types';
import type { Json, Tables } from '@/types/database';

type GenerateOptions = {
  sessionId: string;
  appUserId: string;
  configSlug?: string;
};

type PreStoryRow = Tables<'pre_stories'>;
type ChanceRow = Tables<'chance_scenes'>;
type ScenarioRow = Tables<'scenarios'>;

export async function generateGachaPlay({
  sessionId,
  appUserId,
  configSlug = 'default',
}: GenerateOptions): Promise<GachaEngineResult> {
  const supabase = getServiceSupabase();
  const [config, characters] = await Promise.all([
    fetchGachaConfig(supabase, configSlug),
    fetchActiveCharacters(supabase),
  ]);

  if (!characters.length) {
    throw new Error('No active characters configured.');
  }

  const character = pickCharacterByWeight(characters, config.characterWeights);
  const cards = await fetchCardsByCharacter(supabase, character.id);
  if (!cards.length) {
    throw new Error(`Character ${character.name} has no active cards.`);
  }

  const star = drawStar(config.rtp);
  const starCards = cards.filter((card) => card.star_level === star);
  const selectableCards = starCards.length ? starCards : cards;
  const selectedCard = pickRandom(selectableCards);

  const reversalRate = config.reversalRates[star] ?? 0;
  const hadReversal = Boolean(selectedCard.has_reversal) && randomFloat() < reversalRate;

  const [preStories, chanceScenes, scenarioRows] = await Promise.all([
    fetchPreStories(supabase, character.id),
    fetchChanceScenes(supabase, character.id),
    fetchScenarios(supabase, selectedCard.id),
  ]);

  const story = buildStoryPayload({
    starLevel: star,
    hadReversal,
    characterId: character.id,
    card: selectedCard,
    preStories,
    chanceScenes,
    scenarioRows,
  });

  const historyRow = await insertGachaHistory(supabase, {
    user_session_id: sessionId,
    app_user_id: appUserId,
    star_level: star,
    scenario: story as Json,
    had_reversal: hadReversal,
    gacha_type: 'single',
  });

  const resultRow = await insertGachaResult(supabase, {
    user_session_id: sessionId,
    app_user_id: appUserId,
    character_id: character.id,
    card_id: selectedCard.id,
    star_level: star,
    had_reversal: hadReversal,
    scenario_snapshot: story as Json,
    card_awarded: false,
    history_id: historyRow.id,
    obtained_via: 'single_gacha',
  });

  return {
    story,
    resultRow,
    card: selectedCard,
    character,
  };
}

function pickCharacterByWeight(
  characters: Tables<'characters'>[],
  weights: CharacterWeight[],
) {
  const weighted = characters.map((character) => {
    const weight = weights.find((entry) => entry.characterId === character.id)?.weight ?? 1;
    return { ...character, weight };
  });
  const selected = pickByWeight(weighted);
  const { weight: _weight, ...rest } = selected;
  void _weight;
  return rest;
}

function groupByPattern<T extends { pattern: string }>(rows: T[]): T[][] {
  return Object.values(
    rows.reduce<Record<string, T[]>>((acc, row) => {
      acc[row.pattern] = acc[row.pattern] ?? [];
      acc[row.pattern].push(row);
      return acc;
    }, {}),
  );
}

function buildStoryPayload(params: {
  starLevel: number;
  hadReversal: boolean;
  characterId: string;
  card: Tables<'cards'>;
  preStories: PreStoryRow[];
  chanceScenes: ChanceRow[];
  scenarioRows: ScenarioRow[];
}): StoryPayload {
  const { starLevel, hadReversal, characterId, card, preStories, chanceScenes, scenarioRows } = params;

  const preStoryGroup = groupByPattern(preStories);
  const chosenPreStory = preStoryGroup.length ? pickRandom(preStoryGroup) : [];
  const preStorySegments = chosenPreStory.map((scene) =>
    mapToSegment(scene.id, 'pre_story', scene.scene_order, scene.video_url, scene.duration_seconds ?? 6),
  );

  const chanceSegment = chanceScenes.length
    ? (() => {
        const scene = pickRandom(chanceScenes);
        return [mapToSegment(scene.id, 'chance', 1, scene.video_url, scene.duration_seconds ?? 6)];
      })()
    : [];

  const mainScenes = scenarioRows.filter((row) => row.phase === 'main_story');
  const reversalScenes = hadReversal
    ? scenarioRows.filter((row) => row.phase === 'reversal')
    : [];

  const mainSegments = mainScenes.map((scene) =>
    mapToSegment(
      scene.id,
      'main_story',
      scene.scene_order,
      scene.video_url,
      scene.duration_seconds,
      scene.telop_text,
      scene.telop_type as VideoSegment['telopType'] | undefined,
    ),
  );
  const reversalSegments = reversalScenes.map((scene) =>
    mapToSegment(
      scene.id,
      'reversal',
      scene.scene_order,
      scene.video_url,
      scene.duration_seconds,
      scene.telop_text,
      scene.telop_type as VideoSegment['telopType'] | undefined,
    ),
  );

  return {
    starLevel,
    hadReversal,
    characterId,
    cardId: card.id,
    preStory: preStorySegments,
    chance: chanceSegment,
    mainStory: mainSegments,
    reversalStory: reversalSegments,
    finalCard: {
      id: card.id,
      card_name: card.card_name,
      rarity: card.rarity,
      star_level: card.star_level,
      card_image_url: card.card_image_url,
      has_reversal: card.has_reversal,
    },
  };
}

function mapToSegment(
  id: string,
  phase: VideoSegment['phase'],
  order: number,
  videoUrl: string | null,
  durationSeconds: number,
  telopText?: string | null,
  telopType?: VideoSegment['telopType'],
): VideoSegment {
  if (!videoUrl) {
    throw new Error(`Video URL missing for segment ${id}`);
  }
  return {
    id,
    phase,
    order,
    videoUrl,
    durationSeconds,
    telopText,
    telopType,
  };
}
