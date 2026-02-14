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
import type { GachaResult, Rarity } from '@/lib/gacha/common/types';
import { buildCommonAssetPath } from '@/lib/gacha/assets';
import { getCharacter } from '@/lib/gacha/characters';
import { mapCardDbIdToModuleId, mapCharacterDbIdToModuleId } from '@/lib/gacha/characters/mapping';

type GenerateOptions = {
  sessionId: string;
  appUserId: string;
  configSlug?: string;
};

type PreStoryRow = Tables<'pre_stories'>;
type ChanceRow = Tables<'chance_scenes'>;
type ScenarioRow = Tables<'scenarios'>;

const LOSS_CARD_PATH = buildCommonAssetPath('loss_card.png');

type ScenarioPayload = {
  story: StoryPayload;
  gachaResult: GachaResult;
  card: Tables<'cards'>;
  character: Tables<'characters'>;
  star: number;
  hadReversal: boolean;
};

export async function generateGachaPlay({
  sessionId,
  appUserId,
  configSlug = 'default',
}: GenerateOptions): Promise<GachaEngineResult> {
  const supabase = getServiceSupabase();
  const scenario = await resolveScenario(supabase, configSlug);
  const historyRow = await insertGachaHistory(supabase, {
    user_session_id: sessionId,
    app_user_id: appUserId,
    star_level: scenario.star,
    scenario: scenario.story as Json,
    had_reversal: scenario.hadReversal,
    gacha_type: 'single',
  });
  const resultRow = await insertGachaResult(supabase, {
    user_session_id: sessionId,
    app_user_id: appUserId,
    character_id: scenario.character.id,
    card_id: scenario.card.id,
    star_level: scenario.star,
    had_reversal: scenario.hadReversal,
    scenario_snapshot: scenario.story as Json,
    card_awarded: false,
    history_id: historyRow.id,
    obtained_via: 'single_gacha',
    metadata: ({ gachaResult: scenario.gachaResult } as unknown) as Json,
  });

  return {
    story: scenario.story,
    gachaResult: scenario.gachaResult,
    resultRow,
    card: scenario.card,
    character: scenario.character,
  };
}

export async function generateGuestGachaPlay(configSlug = 'default'): Promise<GachaEngineResult> {
  const supabase = getServiceSupabase();
  const scenario = await resolveScenario(supabase, configSlug);
  return {
    story: scenario.story,
    gachaResult: scenario.gachaResult,
    resultRow: null,
    card: scenario.card,
    character: scenario.character,
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

function buildGachaResult(params: {
  story: StoryPayload;
  supabaseCharacter: Tables<'characters'>;
  supabaseCard: Tables<'cards'>;
  hadReversal: boolean;
  moduleCharacterId: string | null;
}): GachaResult {
  const { story, supabaseCharacter, supabaseCard, hadReversal, moduleCharacterId } = params;
  const characterId = moduleCharacterId ?? supabaseCharacter.id;
  const characterModule = moduleCharacterId ? getCharacter(moduleCharacterId) : null;
  const moduleCardId = mapCardDbIdToModuleId(supabaseCard.id);
  const moduleCard = moduleCardId && characterModule
    ? characterModule.cards.find((card) => card.cardId === moduleCardId)
    : null;
  const cardInfo = moduleCardId && characterModule ? characterModule.getCardDisplayInfo(moduleCardId) : null;
  const cardImagePath = moduleCardId && characterModule
    ? characterModule.getCardImagePath(moduleCardId)
    : supabaseCard.card_image_url ?? '';
  const dondenRoute = hadReversal && moduleCardId && characterModule
    ? characterModule.dondenRoutes.find((route) => route.toCardId === moduleCardId)
    : null;
  const dondenCard = dondenRoute && characterModule
    ? characterModule.cards.find((card) => card.cardId === dondenRoute.fromCardId)
    : null;

  return {
    isLoss: false,
    characterId,
    cardId: moduleCardId ?? supabaseCard.id,
    rarity: moduleCard?.rarity ?? coerceRarity(supabaseCard.rarity),
    starRating: moduleCard?.starRating ?? supabaseCard.star_level ?? story.starLevel,
    cardName: cardInfo?.name ?? supabaseCard.card_name,
    cardTitle: cardInfo?.title ?? supabaseCard.description ?? supabaseCard.card_name,
    cardImagePath,
    lossCardImagePath: LOSS_CARD_PATH,
    isDonden: Boolean(dondenRoute),
    dondenFromCardId: dondenRoute?.fromCardId,
    dondenFromRarity: dondenCard?.rarity,
    isSequel: false,
  };
}

function coerceRarity(value: string | null | undefined): Rarity {
  if (value === 'N' || value === 'R' || value === 'SR' || value === 'SSR' || value === 'UR' || value === 'LR') {
    return value;
  }
  return 'N';
}

async function resolveScenario(supabase: ReturnType<typeof getServiceSupabase>, configSlug: string): Promise<ScenarioPayload> {
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

  // ハズレ用カード（転生失敗）があれば抽選プールから除外し、さらに max_supply / current_supply で在庫が尽きたカードも除外
  const lossCard = cards.find((card) => card.card_name === '転生失敗');
  const basePlayableCards = lossCard ? cards.filter((card) => card.id !== lossCard.id) : cards;
  const supplyFiltered = basePlayableCards.filter((card) => {
    const max = (card as any).max_supply as number | null | undefined;
    const current = (card as any).current_supply as number | null | undefined;
    if (max == null) return true;
    if (current == null) return true;
    return current < max;
  });

  // max_supply が設定されているカードは current_supply >= max_supply になった時点で抽選対象から完全に外す
  const playableCards = supplyFiltered;
  if (!playableCards.length) {
    throw new Error(`Character ${character.name} has no playable cards.`);
  }

  // まず★レベルを抽選（ハズレでも統計用に記録しておく）
  const star = drawStar(config.rtp);
  const starCards = playableCards.filter((card) => card.star_level === star);
  const selectableCards = starCards.length ? starCards : playableCards;
  const selectedCard = pickRandom(selectableCards);
  const lossRoll = randomFloat();
  const isLoss = lossRoll < config.lossRate;

  if (isLoss) {
    // 完全ハズレルート: シナリオは空、ハズレカードのみ表示
    const awardCard = lossCard ?? selectedCard;

    const story: StoryPayload = {
      starLevel: star,
      hadReversal: false,
      characterId: character.id,
      cardId: awardCard.id,
      preStory: [],
      chance: [],
      mainStory: [],
      reversalStory: [],
      finalCard: {
        id: awardCard.id,
        card_name: awardCard.card_name,
        rarity: awardCard.rarity,
        star_level: awardCard.star_level,
        card_image_url: awardCard.card_image_url,
        has_reversal: awardCard.has_reversal,
      },
    };

    const moduleCharacterId = mapCharacterDbIdToModuleId(character.id);
    const characterId = moduleCharacterId ?? character.id;

    const gachaResult: GachaResult = {
      isLoss: true,
      characterId,
      cardId: 'loss',
      rarity: 'N',
      starRating: star,
      cardName: '転生失敗',
      cardTitle: 'この来世は見つかりませんでした...',
      cardImagePath: LOSS_CARD_PATH,
      lossCardImagePath: LOSS_CARD_PATH,
      isDonden: false,
      dondenFromCardId: undefined,
      dondenFromRarity: undefined,
      isSequel: false,
    };

    return {
      story,
      gachaResult,
      card: awardCard,
      character,
      star,
      hadReversal: false,
    };
  }

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

  const moduleCharacterId = mapCharacterDbIdToModuleId(character.id);
  const gachaResult = buildGachaResult({
    story,
    supabaseCharacter: character,
    supabaseCard: selectedCard,
    hadReversal,
    moduleCharacterId,
  });

  return {
    story,
    gachaResult,
    card: selectedCard,
    character,
    star,
    hadReversal,
  };
}
