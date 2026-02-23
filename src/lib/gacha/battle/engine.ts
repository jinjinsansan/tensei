import { randomFloat, pickRandom } from '@/lib/utils/random';
import { getServiceSupabase } from '@/lib/supabase/service';
import {
  fetchCardsByCharacter,
  insertGachaHistory,
  insertGachaResult,
  ensureGachaResultAwarded,
  setGachaHistoryStatus,
  createMultiGachaSession,
  updateMultiGachaSession,
} from '@/lib/data/gacha';
import {
  fetchBattleGachaSettings,
  type BattleGachaSettings,
} from '@/lib/data/battle-gacha';
import { mapCharacterModuleIdToDbId, mapCardDbIdToModuleId } from '@/lib/gacha/characters/mapping';
import { getCharacter } from '@/lib/gacha/characters';
import { buildCommonAssetPath } from '@/lib/gacha/assets';
import { buildCollectionEntryFromInventory } from '@/lib/collection/supabase';
import { emitCollectionEventToEdge } from '@/lib/cloudflare/collection-cache';
import { BATTLE_READY_CHARACTERS } from '@/lib/gacha/battle/video-paths';
import type { Tables, Json } from '@/types/database';
import type { CharacterId, GachaResult, Rarity } from '@/lib/gacha/common/types';

const LOSS_CARD_PATH = buildCommonAssetPath('loss_card.png');

export type BattleGachaEngineResult = {
  gachaResult: GachaResult;
  resultRow: Tables<'gacha_results'> | null;
  card: Tables<'cards'>;
  character: Tables<'characters'>;
  playerCharacterId: CharacterId;
  playerStar: number;
  enemyCharacterId: CharacterId;
  enemyStar: number;
  isReversal: boolean; // true=敵★が高い（どんでん返し演出）
};

export type BattleBatchResult = {
  pulls: BattleGachaEngineResult[];
  multiSession: Tables<'multi_gacha_sessions'> | null;
};

type BattleGenerateOptions = {
  sessionId: string;
  appUserId: string;
  drawCount?: number;
};

export async function generateBattleGachaBatchPlay({
  sessionId,
  appUserId,
  drawCount = 10,
}: BattleGenerateOptions): Promise<BattleBatchResult> {
  const supabase = getServiceSupabase();
  if (!sessionId || !appUserId) {
    throw new Error('Session とユーザー情報が不足しています。');
  }

  const settings = await fetchBattleGachaSettings(supabase);
  if (!settings.isEnabled) {
    throw new Error('バトルガチャは現在準備中です。');
  }

  const safeCount = Math.max(1, drawCount);
  const pulls: BattleGachaEngineResult[] = [];
  let sessionRow: Tables<'multi_gacha_sessions'> | null = null;

  // キャラクター DB ID のキャッシュ
  const characterRowCache = new Map<string, Tables<'characters'>>();
  const cardCache = new Map<string, Tables<'cards'>[]>();

  try {
    if (safeCount > 1) {
      sessionRow = await createMultiGachaSession(supabase, {
        app_user_id: appUserId,
        total_pulls: safeCount,
        pulls_completed: 0,
        status: 'running',
        metadata: ({ gacha_type: 'battle_gacha' } as unknown) as Json,
      });
    }

    const scenarios: Array<{
      gachaResult: GachaResult;
      card: Tables<'cards'>;
      character: Tables<'characters'>;
      playerCharacterId: CharacterId;
      playerStar: number;
      enemyCharacterId: CharacterId;
      enemyStar: number;
      isReversal: boolean;
    }> = [];

    for (let i = 0; i < safeCount; i++) {
      const scenario = await resolveBattleScenario(supabase, settings, characterRowCache, cardCache);
      scenarios.push(scenario);
    }

    const resultPromises = scenarios.map(async (scenario) => {
      const historyRow = await insertGachaHistory(supabase, {
        user_session_id: sessionId,
        app_user_id: appUserId,
        multi_session_id: sessionRow?.id ?? null,
        star_level: scenario.playerStar,
        scenario: ({} as unknown) as Json,
        had_reversal: scenario.isReversal,
        gacha_type: 'tenfold',
      });

      let resultRow = await insertGachaResult(supabase, {
        user_session_id: sessionId,
        app_user_id: appUserId,
        character_id: scenario.character.id,
        card_id: scenario.card.id,
        star_level: scenario.playerStar,
        had_reversal: scenario.isReversal,
        scenario_snapshot: ({} as unknown) as Json,
        card_awarded: false,
        history_id: historyRow.id,
        obtained_via: 'battle_gacha',
        metadata: ({ gacha_type: 'battle_gacha', enemy: scenario.enemyCharacterId, enemyStar: scenario.enemyStar, isReversal: scenario.isReversal } as unknown) as Json,
      });

      if (scenario.gachaResult.isLoss) {
        const awardOutcome = await ensureGachaResultAwarded(supabase, {
          resultRow,
          card: scenario.card,
          appUserId,
          userSessionId: sessionId,
        });
        resultRow = awardOutcome.resultRow;
        await setGachaHistoryStatus(supabase, historyRow.id, 'success');

        if (awardOutcome.didAward && awardOutcome.inventoryRow) {
          const entry = buildCollectionEntryFromInventory(awardOutcome.inventoryRow, awardOutcome.card);
          const distinctDelta = awardOutcome.alreadyOwnedBeforeAward ? 0 : 1;
          void emitCollectionEventToEdge(appUserId, {
            type: 'add',
            entry,
            totalOwnedDelta: 1,
            distinctOwnedDelta: distinctDelta,
          });
        }
      }

      return {
        gachaResult: scenario.gachaResult,
        resultRow,
        card: scenario.card,
        character: scenario.character,
        playerCharacterId: scenario.playerCharacterId,
        playerStar: scenario.playerStar,
        enemyCharacterId: scenario.enemyCharacterId,
        enemyStar: scenario.enemyStar,
        isReversal: scenario.isReversal,
      } as BattleGachaEngineResult;
    });

    const results = await Promise.all(resultPromises);
    pulls.push(...results);

    if (sessionRow) {
      await updateMultiGachaSession(supabase, sessionRow.id, {
        pulls_completed: safeCount,
        status: 'completed',
        updated_at: new Date().toISOString(),
      });
    }

    return { pulls, multiSession: sessionRow };
  } catch (error) {
    if (sessionRow) {
      await updateMultiGachaSession(supabase, sessionRow.id, {
        status: 'error',
        updated_at: new Date().toISOString(),
      }).catch((e) => console.error('Failed to update battle session state', e));
    }
    throw error;
  }
}

async function resolveBattleScenario(
  supabase: ReturnType<typeof getServiceSupabase>,
  settings: BattleGachaSettings,
  characterRowCache: Map<string, Tables<'characters'>>,
  cardCache: Map<string, Tables<'cards'>[]>,
) {
  // 1. ロス判定
  const isLoss = randomFloat() * 100 < settings.lossRate;

  if (isLoss) {
    const kentaDbId = mapCharacterModuleIdToDbId('kenta')!;
    const cards = await getCachedCards(supabase, kentaDbId, cardCache);
    const lossCard =
      cards.find((c) => c.is_loss_card) ??
      cards.find((c) => c.card_name === '転生失敗') ??
      cards[0];
    const characterRow = await getCachedCharacter(supabase, kentaDbId, characterRowCache);
    const enemyCharacterId = pickEnemy('kenta');
    return {
      gachaResult: buildLossResult(),
      card: lossCard,
      character: characterRow,
      playerCharacterId: 'kenta' as CharacterId,
      playerStar: 0,
      enemyCharacterId,
      enemyStar: 1,
      isReversal: false,
    };
  }

  // 2. 自キャラ選択（バトル対応キャラのみ）
  const playerCharId = BATTLE_READY_CHARACTERS[
    Math.floor(randomFloat() * BATTLE_READY_CHARACTERS.length)
  ] as CharacterId;

  const characterDbId = mapCharacterModuleIdToDbId(playerCharId)!;
  const characterRow = await getCachedCharacter(supabase, characterDbId, characterRowCache);

  // 3. ★抽選
  const starLevel = drawStarLevel(settings.starDistribution);

  // 4. カード選択
  const allCards = await getCachedCards(supabase, characterDbId, cardCache);
  const playableCards = allCards.filter((c) => !c.is_loss_card && c.card_name !== '転生失敗');
  const starMatched = playableCards.filter((c) => Number(c.star_level ?? 0) === starLevel);
  const selectableCards = starMatched.length ? starMatched : playableCards;
  const selectedCard = pickRandom(selectableCards);
  const playerStar = selectedCard.star_level ?? starLevel;

  // 5. GachaResult 構築（battle gacha は isDonden=false 固定）
  const characterModule = getCharacter(playerCharId);
  const moduleCardId = mapCardDbIdToModuleId(selectedCard.id);
  const moduleCard = moduleCardId && characterModule
    ? characterModule.cards.find((c) => c.cardId === moduleCardId)
    : null;
  const cardInfo = moduleCardId && characterModule
    ? characterModule.getCardDisplayInfo(moduleCardId)
    : null;
  const cardImagePath = moduleCardId && characterModule
    ? characterModule.getCardImagePath(moduleCardId)
    : selectedCard.card_image_url ?? '';

  const gachaResult: GachaResult = {
    isLoss: false,
    characterId: playerCharId,
    cardId: moduleCardId ?? selectedCard.id,
    rarity: moduleCard?.rarity ?? coerceRarity(selectedCard.rarity),
    starRating: playerStar,
    cardName: cardInfo?.name ?? selectedCard.card_name,
    cardTitle: cardInfo?.title ?? selectedCard.description ?? selectedCard.card_name,
    cardImagePath,
    lossCardImagePath: LOSS_CARD_PATH,
    isDonden: false,
    isSequel: false,
  };

  // 6. 敵キャラ・どんでん返し判定
  const enemyCharacterId = pickEnemy(playerCharId);
  const isReversal = randomFloat() * 100 < settings.reversalRate;
  // isReversal=true → 敵★ > 自★（苦戦演出）, false → 敵★ < 自★（自キャラ優勢）
  // 最低★3以上にして転生後らしい映像を確保する
  const enemyStar = isReversal
    ? Math.min(12, playerStar + 1 + Math.floor(randomFloat() * 3))              // +1〜+3
    : Math.max(3, playerStar - 1 - Math.floor(randomFloat() * 2));              // -1〜-2 ただし最低3

  return { gachaResult, card: selectedCard, character: characterRow, playerCharacterId: playerCharId, playerStar, enemyCharacterId, enemyStar, isReversal };
}

function pickEnemy(playerCharId: CharacterId): CharacterId {
  const others = BATTLE_READY_CHARACTERS.filter((c) => c !== (playerCharId as string));
  if (!others.length) return BATTLE_READY_CHARACTERS[0] as CharacterId;
  return others[Math.floor(randomFloat() * others.length)] as CharacterId;
}

function drawStarLevel(distribution: number[]): number {
  const source = distribution.length === 12 ? distribution : Array(12).fill(100 / 12);
  const total = source.reduce((sum, v) => sum + (Number.isFinite(v) ? v : 0), 0);
  if (total <= 0) return 1;
  const roll = randomFloat() * total;
  let cumulative = 0;
  for (let i = 0; i < source.length; i++) {
    cumulative += Number.isFinite(source[i]) ? source[i] : 0;
    if (roll <= cumulative) return i + 1;
  }
  return source.length;
}

function buildLossResult(): GachaResult {
  return {
    isLoss: true,
    characterId: 'kenta',
    cardId: 'loss',
    rarity: 'N',
    starRating: 0,
    cardName: '転生失敗',
    cardTitle: 'この来世は見つかりませんでした...',
    cardImagePath: '/raise-gacha-logo.png',
    lossCardImagePath: LOSS_CARD_PATH,
    isDonden: false,
    isSequel: false,
  };
}

function coerceRarity(value: string | null | undefined): Rarity {
  if (value === 'N' || value === 'R' || value === 'SR' || value === 'SSR' || value === 'UR' || value === 'LR') {
    return value;
  }
  return 'N';
}

async function getCachedCharacter(
  supabase: ReturnType<typeof getServiceSupabase>,
  characterDbId: string,
  cache: Map<string, Tables<'characters'>>,
): Promise<Tables<'characters'>> {
  const cached = cache.get(characterDbId);
  if (cached) return cached;
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('id', characterDbId)
    .limit(1)
    .single();
  if (error || !data) throw error ?? new Error(`Character not found: ${characterDbId}`);
  const row = data as Tables<'characters'>;
  cache.set(characterDbId, row);
  return row;
}

async function getCachedCards(
  supabase: ReturnType<typeof getServiceSupabase>,
  characterDbId: string,
  cache: Map<string, Tables<'cards'>[]>,
): Promise<Tables<'cards'>[]> {
  const cached = cache.get(characterDbId);
  if (cached) return cached;
  const cards = await fetchCardsByCharacter(supabase, characterDbId);
  cache.set(characterDbId, cards);
  return cards;
}
