import type { CardDisplayInfo, CharacterModule } from '@/lib/gacha/common/types';
import { buildCharacterAssetPath } from '@/lib/gacha/assets';
import { registerCharacter } from '@/lib/gacha/characters/character-registry';
import { REIKO_CARDS, REIKO_CARD_DESCRIPTIONS } from '@/lib/gacha/characters/reiko/reiko-cards';
import { REIKO_DONDEN_ROUTES } from '@/lib/gacha/characters/reiko/reiko-donden';
import { getModuleCardImageOverride } from '@/lib/gacha/card-image-overrides';

const PRE_SCENE_PATTERNS = [
  { patternId: 'A', steps: 2 },
  { patternId: 'B', steps: 2 },
  { patternId: 'C', steps: 2 },
  { patternId: 'D', steps: 2 },
];

const CHANCE_SCENES = PRE_SCENE_PATTERNS.map(({ patternId }) => ({ patternId }));

const REIKO_MODULE: CharacterModule = {
  characterId: 'reiko',
  characterName: '霊能者・麗子',
  cards: REIKO_CARDS,
  preScenePatterns: PRE_SCENE_PATTERNS,
  chanceScenes: CHANCE_SCENES,
  dondenRoutes: REIKO_DONDEN_ROUTES,
  getTitleVideoPath: (cardId) =>
    buildCharacterAssetPath('reiko', 'title', `reiko_title_${getCardCode(cardId)}.mp4`),
  getPreSceneVideoPath: (patternId, step) =>
    buildCharacterAssetPath('reiko', 'pre', `reiko_pre_${patternId}${step}.mp4`),
  getChanceSceneVideoPath: (patternId) =>
    buildCharacterAssetPath('reiko', 'chance', `reiko_chance_${patternId}.mp4`),
  getMainSceneVideoPath: (cardId, step) =>
    buildCharacterAssetPath('reiko', 'main', `reiko_${getCardCode(cardId)}_${step}.mp4`),
  getDondenVideoPath: (fromCardId, toCardId, step) =>
    buildCharacterAssetPath(
      'reiko',
      'reversal',
      `reiko_rev_${getCardCode(fromCardId)}_${getCardCode(toCardId)}_${step}.mp4`,
    ),
  getCardImagePath: (cardId) => getModuleCardImageOverride(cardId) ?? buildCardImagePath(cardId),
  getCardDisplayInfo: (cardId) => buildCardDisplayInfo(cardId),
};

registerCharacter(REIKO_MODULE);

export { REIKO_MODULE };

function getCardCode(cardId: string): string {
  const match = cardId.match(/card(\d+)/);
  const numeric = match?.[1] ?? cardId;
  return `c${numeric.padStart(2, '0')}`;
}

function buildCardImagePath(cardId: string): string {
  const match = cardId.match(/card(\d+)/);
  const suffix = match?.[1]?.padStart(2, '0') ?? '01';
  return `/reiko_cards_v2/reiko_card${suffix}.png`;
}

function buildCardDisplayInfo(cardId: string): CardDisplayInfo {
  const card = REIKO_CARDS.find((entry) => entry.cardId === cardId);
  if (!card) {
    return {
      name: '???',
      title: '未知の来世',
      description: '未登録カードが選択されました。',
      rarity: 'N',
      starRating: 1,
    };
  }
  return {
    name: card.name,
    title: card.title,
    description: REIKO_CARD_DESCRIPTIONS[cardId] ?? `${card.name}の章が開放されました。`,
    rarity: card.rarity,
    starRating: card.starRating,
  };
}
