import type { CardDisplayInfo, CharacterModule } from '@/lib/gacha/common/types';
import { buildCharacterAssetPath } from '@/lib/gacha/assets';
import { registerCharacter } from '@/lib/gacha/characters/character-registry';
import { TATUMI_CARDS, TATUMI_CARD_DESCRIPTIONS } from '@/lib/gacha/characters/tatumi/tatumi-cards';
import { TATUMI_DONDEN_ROUTES } from '@/lib/gacha/characters/tatumi/tatumi-donden';

const PRE_SCENE_PATTERNS = [
  { patternId: 'a', steps: 2 },
  { patternId: 'b', steps: 2 },
  { patternId: 'c', steps: 2 },
  { patternId: 'd', steps: 2 },
];

const CHANCE_SCENES = PRE_SCENE_PATTERNS.map(({ patternId }) => ({ patternId }));

const TATUMI_MODULE: CharacterModule = {
  characterId: 'tatumi',
  characterName: '辰巳剛',
  cards: TATUMI_CARDS,
  preScenePatterns: PRE_SCENE_PATTERNS,
  chanceScenes: CHANCE_SCENES,
  dondenRoutes: TATUMI_DONDEN_ROUTES,
  getTitleVideoPath: (cardId) =>
    buildCharacterAssetPath('tatumi', 'title', `tatumi_title_${getCardCode(cardId)}.mp4`),
  getPreSceneVideoPath: (patternId, step) =>
    buildCharacterAssetPath('tatumi', 'pre', `tatumi_pre_${patternId.toLowerCase()}${step}.mp4`),
  getChanceSceneVideoPath: (patternId) =>
    buildCharacterAssetPath('tatumi', 'chance', `tatumi_chance_${patternId.toLowerCase()}.mp4`),
  getMainSceneVideoPath: (cardId, step) =>
    buildCharacterAssetPath('tatumi', 'main', `tatumi_${getCardCode(cardId)}_${step}.mp4`),
  getDondenVideoPath: (fromCardId, toCardId, step) =>
    buildCharacterAssetPath(
      'tatumi',
      'donden',
      `tatumi_rev_${getCardCode(fromCardId)}_${getCardCode(toCardId)}_${step}.mp4`,
    ),
  getCardImagePath: (cardId) => buildCardImagePath(cardId),
  getCardDisplayInfo: (cardId) => buildCardDisplayInfo(cardId),
};

registerCharacter(TATUMI_MODULE);

export { TATUMI_MODULE };

function getCardCode(cardId: string): string {
  const match = cardId.match(/card(\d+)/);
  const numeric = match?.[1] ?? cardId;
  return `c${numeric.padStart(2, '0')}`;
}

function buildCardImagePath(cardId: string): string {
  const match = cardId.match(/card(\d+)/);
  const suffix = match?.[1]?.padStart(2, '0') ?? '01';
  return `/tatumi_cards/tatumi_card${suffix}.png`;
}

function buildCardDisplayInfo(cardId: string): CardDisplayInfo {
  const card = TATUMI_CARDS.find((entry) => entry.cardId === cardId);
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
    description: TATUMI_CARD_DESCRIPTIONS[cardId] ?? `${card.name}の章が開放されました。`,
    rarity: card.rarity,
    starRating: card.starRating,
  };
}
