import type { CardDisplayInfo, CharacterModule } from '@/lib/gacha/common/types';
import { buildCharacterAssetPath } from '@/lib/gacha/assets';
import { registerCharacter } from '@/lib/gacha/characters/character-registry';
import { SHOICHI_CARDS, SHOICHI_CARD_DESCRIPTIONS } from '@/lib/gacha/characters/shoichi/shoichi-cards';
import { SHOICHI_DONDEN_ROUTES } from '@/lib/gacha/characters/shoichi/shoichi-donden';
import { getModuleCardImageOverride } from '@/lib/gacha/card-image-overrides';

const PRE_SCENE_PATTERNS = [
  { patternId: 'A', steps: 2 },
  { patternId: 'B', steps: 2 },
  { patternId: 'C', steps: 2 },
  { patternId: 'D', steps: 2 },
];

const CHANCE_SCENES = ['A', 'B', 'C', 'D'].map((patternId) => ({ patternId }));

const SHOICHI_MODULE: CharacterModule = {
  characterId: 'shoichi',
  characterName: '正一',
  cards: SHOICHI_CARDS,
  preScenePatterns: PRE_SCENE_PATTERNS,
  chanceScenes: CHANCE_SCENES,
  dondenRoutes: SHOICHI_DONDEN_ROUTES,
  getTitleVideoPath: (cardId) =>
    buildCharacterAssetPath('shoichi', 'title', `shoichi_title_${getCardCode(cardId)}.mp4`),
  getPreSceneVideoPath: (patternId, step) =>
    buildCharacterAssetPath('shoichi', 'pre', `shoichi_pre_${patternId.toLowerCase()}${step}.mp4`),
  getChanceSceneVideoPath: (patternId) =>
    buildCharacterAssetPath('shoichi', 'chance', `shoichi_chance_${patternId.toLowerCase()}.mp4`),
  getMainSceneVideoPath: (cardId, step) =>
    buildCharacterAssetPath('shoichi', 'main', `shoichi_${getCardCode(cardId)}_${step}.mp4`),
  getDondenVideoPath: (fromCardId, toCardId, step) =>
    buildCharacterAssetPath(
      'shoichi',
      'donden',
      `shoichi_rev_${getCardCode(fromCardId)}_${getCardCode(toCardId)}_${step}.mp4`,
    ),
  getCardImagePath: (cardId) => getModuleCardImageOverride(cardId) ?? `/shoichi_cards/shoichi_${cardId}.png`,
  getCardDisplayInfo: (cardId) => buildCardDisplayInfo(cardId),
};

registerCharacter(SHOICHI_MODULE);

export { SHOICHI_MODULE };

function getCardCode(cardId: string): string {
  const match = cardId.match(/card(\d+)/);
  const numeric = match?.[1] ?? cardId;
  return `c${numeric.padStart(2, '0')}`;
}

function buildCardDisplayInfo(cardId: string): CardDisplayInfo {
  const card = SHOICHI_CARDS.find((entry) => entry.cardId === cardId);
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
    description: SHOICHI_CARD_DESCRIPTIONS[cardId] ?? `${card.name}の章が開放されました。`,
    rarity: card.rarity,
    starRating: card.starRating,
  };
}
