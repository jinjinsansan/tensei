import type { CardDisplayInfo, CharacterModule } from '@/lib/gacha/common/types';
import { buildCharacterAssetPath } from '@/lib/gacha/assets';
import { registerCharacter } from '@/lib/gacha/characters/character-registry';
import { KENTA_CARDS, KENTA_CARD_DESCRIPTIONS } from '@/lib/gacha/characters/kenta/kenta-cards';
import { KENTA_DONDEN_ROUTES } from '@/lib/gacha/characters/kenta/kenta-donden';
import { getModuleCardImageOverride } from '@/lib/gacha/card-image-overrides';

const PRE_SCENE_PATTERNS = [
  { patternId: 'A', steps: 2 },
  { patternId: 'B', steps: 2 },
  { patternId: 'C', steps: 2 },
  { patternId: 'D', steps: 2 },
];

const CHANCE_SCENES = ['A', 'B', 'C', 'D'].map((patternId) => ({ patternId }));

const KENTA_MODULE: CharacterModule = {
  characterId: 'kenta',
  characterName: '健太',
  cards: KENTA_CARDS,
  preScenePatterns: PRE_SCENE_PATTERNS,
  chanceScenes: CHANCE_SCENES,
  dondenRoutes: KENTA_DONDEN_ROUTES,
  getTitleVideoPath: (cardId) =>
    buildCharacterAssetPath('kenta', 'title', `kenta_title_${getCardCode(cardId)}.mp4`),
  getPreSceneVideoPath: (patternId, step) =>
    buildCharacterAssetPath('kenta', 'pre', `kenta_pre_${patternId.toLowerCase()}${step}.mp4`),
  getChanceSceneVideoPath: (patternId) =>
    buildCharacterAssetPath('kenta', 'chance', `kenta_chance_${patternId.toLowerCase()}.mp4`),
  getMainSceneVideoPath: (cardId, step) =>
    buildCharacterAssetPath('kenta', 'main', `kenta_${getCardCode(cardId)}_${step}.mp4`),
  getDondenVideoPath: (fromCardId, toCardId, step) =>
    buildCharacterAssetPath(
      'kenta',
      'donden',
      `kenta_rev_${getCardCode(fromCardId)}_${getCardCode(toCardId)}_${step}.mp4`,
    ),
  getCardImagePath: (cardId) => getModuleCardImageOverride(cardId) ?? `/kenta_cards/${cardId}.png`,
  getCardDisplayInfo: (cardId) => buildCardDisplayInfo(cardId),
};

registerCharacter(KENTA_MODULE);

export { KENTA_MODULE };

function getCardCode(cardId: string): string {
  const match = cardId.match(/card(\d+)/);
  const numeric = match?.[1] ?? cardId;
  return `c${numeric.padStart(2, '0')}`;
}

function buildCardDisplayInfo(cardId: string): CardDisplayInfo {
  const card = KENTA_CARDS.find((entry) => entry.cardId === cardId);
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
    description: KENTA_CARD_DESCRIPTIONS[cardId] ?? `${card.name}の章が開放されました。`,
    rarity: card.rarity,
    starRating: card.starRating,
  };
}
