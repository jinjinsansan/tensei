import type { CardDisplayInfo, CharacterModule } from '@/lib/gacha/common/types';
import { buildCharacterAssetPath } from '@/lib/gacha/assets';
import { registerCharacter } from '@/lib/gacha/characters/character-registry';
import { YAHEI_CARDS, YAHEI_CARD_DESCRIPTIONS } from '@/lib/gacha/characters/yahei/yahei-cards';
import { YAHEI_DONDEN_ROUTES } from '@/lib/gacha/characters/yahei/yahei-donden';
import { getModuleCardImageOverride } from '@/lib/gacha/card-image-overrides';

const PRE_SCENE_PATTERNS = [
  { patternId: 'a', steps: 2 },
  { patternId: 'b', steps: 2 },
  { patternId: 'c', steps: 2 },
  { patternId: 'd', steps: 2 },
];

const CHANCE_SCENES = PRE_SCENE_PATTERNS.map(({ patternId }) => ({ patternId }));

const YAHEI_MODULE: CharacterModule = {
  characterId: 'yahei',
  characterName: '弥平',
  cards: YAHEI_CARDS,
  preScenePatterns: PRE_SCENE_PATTERNS,
  chanceScenes: CHANCE_SCENES,
  dondenRoutes: YAHEI_DONDEN_ROUTES,
  getTitleVideoPath: (cardId) =>
    buildCharacterAssetPath('yahei', 'title', `yahei_title_${getCardCode(cardId)}.mp4`),
  getPreSceneVideoPath: (patternId, step) =>
    buildCharacterAssetPath('yahei', 'pre', `yahei_pre_${patternId.toLowerCase()}${step}.mp4`),
  getChanceSceneVideoPath: (patternId) =>
    buildCharacterAssetPath('yahei', 'chance', `yahei_chance_${patternId.toLowerCase()}.mp4`),
  getMainSceneVideoPath: (cardId, step) =>
    buildCharacterAssetPath('yahei', 'main', `yahei_${getCardCode(cardId)}_${step}.mp4`),
  getDondenVideoPath: (fromCardId, toCardId, step) =>
    buildCharacterAssetPath(
      'yahei',
      'donden',
      `yahei_rev_${getCardCode(fromCardId)}_${getCardCode(toCardId)}_${step}.mp4`,
    ),
  getCardImagePath: (cardId) => getModuleCardImageOverride(cardId) ?? buildCardImagePath(cardId),
  getCardDisplayInfo: (cardId) => buildCardDisplayInfo(cardId),
};

registerCharacter(YAHEI_MODULE);

export { YAHEI_MODULE };

function getCardCode(cardId: string): string {
  const match = cardId.match(/card(\d+)/);
  const numeric = match?.[1] ?? cardId;
  return `c${numeric.padStart(2, '0')}`;
}

function buildCardImagePath(cardId: string): string {
  const match = cardId.match(/card(\d+)/);
  const suffix = match?.[1]?.padStart(2, '0') ?? '01';
  return `/yahei_cards/yahei_card${suffix}.png`;
}

function buildCardDisplayInfo(cardId: string): CardDisplayInfo {
  const card = YAHEI_CARDS.find((entry) => entry.cardId === cardId);
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
    description: YAHEI_CARD_DESCRIPTIONS[cardId] ?? `${card.name}の章が開放されました。`,
    rarity: card.rarity,
    starRating: card.starRating,
  };
}
