import { randomFloat, pickRandom, pickByWeight } from '@/lib/utils/random';
import { getServiceSupabase } from '@/lib/supabase/service';
import {
  fetchCardsByCharacter,
  fetchChanceScenes,
  fetchCharacterRtpConfig,
  fetchGachaCharactersConfig,
  fetchGachaGlobalConfig,
  fetchPreStories,
  fetchScenarios,
  insertGachaResult,
  insertGachaHistory,
} from '@/lib/data/gacha';
import type { StoryPayload, VideoSegment, GachaEngineResult } from '@/lib/gacha/types';
import type { Json, Tables } from '@/types/database';
import type { CharacterId, GachaResult, Rarity } from '@/lib/gacha/common/types';
import { buildCommonAssetPath } from '@/lib/gacha/assets';
import { getCharacter } from '@/lib/gacha/characters';
import { mapCardDbIdToModuleId, mapCharacterModuleIdToDbId } from '@/lib/gacha/characters/mapping';

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
  supabaseCard: Tables<'cards'>;
  hadReversal: boolean;
  moduleCharacterId: CharacterId;
}): GachaResult {
  const { story, supabaseCard, hadReversal, moduleCharacterId } = params;
  const characterId = moduleCharacterId;
  const characterModule = getCharacter(moduleCharacterId) ?? null;
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
async function resolveScenario(
  supabase: ReturnType<typeof getServiceSupabase>,
  _configSlug: string,
): Promise<ScenarioPayload> {
  // 1. 共通ハズレ率 & キャラクター設定を取得
  void _configSlug;
  const [globalConfig, gachaCharacters] = await Promise.all([
    fetchGachaGlobalConfig(supabase),
    fetchGachaCharactersConfig(supabase),
  ]);

  const activeCharacters = gachaCharacters.filter((c) => c.isActive && c.weight > 0);
  if (!activeCharacters.length) {
    throw new Error('有効なガチャキャラクターが設定されていません。');
  }

  // 2. LOSS / 当たり判定（仕様: lossRate は 0〜100）
  const isLoss = randomFloat() * 100 < globalConfig.lossRate;

  if (isLoss) {
    // 仕様上はキャラ抽選を行わないが、DB上は健太のLOSSカードを使って記録する
    const kentaDbId = mapCharacterModuleIdToDbId('kenta');
    if (!kentaDbId) {
      throw new Error('Kenta character mapping is missing.');
    }

    const cards = await fetchCardsByCharacter(supabase, kentaDbId);
    if (!cards.length) {
      throw new Error('LOSS処理用のカードが見つかりません。');
    }

    const lossCard =
      cards.find((card) => card.is_loss_card) ?? cards.find((card) => card.card_name === '転生失敗') ?? cards[0];

    const story: StoryPayload = {
      starLevel: lossCard.star_level ?? 0,
      hadReversal: false,
      characterId: kentaDbId,
      cardId: lossCard.id,
      preStory: [],
      chance: [],
      mainStory: [],
      reversalStory: [],
      finalCard: {
        id: lossCard.id,
        card_name: lossCard.card_name,
        rarity: lossCard.rarity,
        star_level: lossCard.star_level,
        card_image_url: lossCard.card_image_url,
        has_reversal: lossCard.has_reversal,
      },
    };

    const { data: characterRow, error } = await supabase
      .from('characters')
      .select('*')
      .eq('id', kentaDbId)
      .limit(1)
      .single();
    if (error || !characterRow) {
      throw error ?? new Error('Kenta character row not found.');
    }

    const gachaResult: GachaResult = {
      isLoss: true,
      characterId: 'kenta', // LOSS時は参照しないがデフォルトとして保持
      cardId: 'loss',
      rarity: 'N',
      starRating: 0,
      cardName: '転生失敗',
      cardTitle: 'この来世は見つかりませんでした...',
      cardImagePath: '/raise-gacha-logo.png',
      lossCardImagePath: LOSS_CARD_PATH,
      isDonden: false,
      dondenFromCardId: undefined,
      dondenFromRarity: undefined,
      isSequel: false,
    };

    return {
      story,
      gachaResult,
      card: lossCard,
      character: characterRow as Tables<'characters'>,
      star: story.starLevel,
      hadReversal: false,
    };
  }

  // 3. キャラクター抽選（gacha_characters.weight に基づく）
  const selectedCharacterConfig = pickByWeight(activeCharacters.map((c) => ({ ...c })));
  const moduleCharacterId = selectedCharacterConfig.characterId;

  const characterDbId = mapCharacterModuleIdToDbId(moduleCharacterId);
  if (!characterDbId) {
    throw new Error(`Character mapping not found for module id: ${moduleCharacterId}`);
  }

  const { data: supabaseCharacterRow, error: characterError } = await supabase
    .from('characters')
    .select('*')
    .eq('id', characterDbId)
    .limit(1)
    .single();
  if (characterError || !supabaseCharacterRow) {
    throw characterError ?? new Error('Character row not found');
  }

  const supabaseCharacter = supabaseCharacterRow as Tables<'characters'>;

  // 4. キャラ別RTP取得 & レア度抽選
  const rtp = await fetchCharacterRtpConfig(supabase, moduleCharacterId);
  const rarity = drawRarity(rtp.rarityDistribution);

  // 5. カードプール取得（max_supply / current_supply を考慮）
  const cards = await fetchCardsByCharacter(supabase, characterDbId);
  if (!cards.length) {
    throw new Error(`Character ${supabaseCharacter.name} has no active cards.`);
  }

  const lossCard = cards.find((card) => card.is_loss_card || card.card_name === '転生失敗');
  const basePlayableCards = lossCard ? cards.filter((card) => card.id !== lossCard.id) : cards;
  const supplyFiltered = basePlayableCards.filter((card) => {
    if (card.is_loss_card) return true;
    const max = card.max_supply;
    const current = card.current_supply;
    if (max == null) return true;
    if (current == null) return true;
    return current < max;
  });

  const playableCards = supplyFiltered;
  if (!playableCards.length) {
    throw new Error(`Character ${supabaseCharacter.name} has no playable cards.`);
  }

  const rarityMatched = playableCards.filter((card) => coerceRarity(card.rarity) === rarity);
  const selectableCards = rarityMatched.length ? rarityMatched : playableCards;
  const selectedCard = pickRandom(selectableCards);

  const star = selectedCard.star_level;

  // 6. どんでん返し判定（キャラ別 dondenRate）
  const characterModule = getCharacter(moduleCharacterId);
  const moduleCardId = mapCardDbIdToModuleId(selectedCard.id);
  const hasDondenRoute = Boolean(
    moduleCardId && characterModule?.dondenRoutes?.some((route) => route.toCardId === moduleCardId),
  );

  const hadReversal = hasDondenRoute && randomFloat() * 100 < rtp.dondenRate;

  const [preStories, chanceScenes, scenarioRows] = await Promise.all([
    fetchPreStories(supabase, characterDbId),
    fetchChanceScenes(supabase, characterDbId),
    fetchScenarios(supabase, selectedCard.id),
  ]);

  const story = buildStoryPayload({
    starLevel: star,
    hadReversal,
    characterId: characterDbId,
    card: selectedCard,
    preStories,
    chanceScenes,
    scenarioRows,
  });

  const gachaResult = buildGachaResult({
    story,
    supabaseCard: selectedCard,
    hadReversal,
    moduleCharacterId: moduleCharacterId as CharacterId,
  });

  return {
    story,
    gachaResult,
    card: selectedCard,
    character: supabaseCharacter,
    star,
    hadReversal,
  };
}

function drawRarity(distribution: Record<Rarity, number>): Rarity {
  const entries: [Rarity, number][] = [
    ['N', distribution.N ?? 0],
    ['R', distribution.R ?? 0],
    ['SR', distribution.SR ?? 0],
    ['SSR', distribution.SSR ?? 0],
    ['UR', distribution.UR ?? 0],
    ['LR', distribution.LR ?? 0],
  ];

  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  if (total <= 0) {
    return 'N';
  }

  const roll = randomFloat() * total;
  let cumulative = 0;
  for (const [rarity, value] of entries) {
    cumulative += value;
    if (roll <= cumulative) return rarity;
  }
  return entries[entries.length - 1][0];
}
