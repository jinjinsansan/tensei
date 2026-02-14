import { selectByWeights } from '@/lib/gacha/common/probabilities';
import type { TitleVideoSelection } from '@/lib/gacha/common/types';

const REAL_CARD_PROBABILITY = 0.6;

const STAR_WEIGHTS_REAL = [5, 10, 15, 35, 35];
const STAR_WEIGHTS_FAKE = [30, 30, 20, 15, 5];

export function chooseTitleVideo(
  realCardId: string,
  allCardIds: string[],
): TitleVideoSelection {
  const shouldUseReal = Math.random() < REAL_CARD_PROBABILITY;
  const otherCards = allCardIds.filter((id) => id !== realCardId);
  const canUseFake = shouldUseReal ? false : otherCards.length > 0;
  const videoCardId = canUseFake
    ? otherCards[Math.floor(Math.random() * otherCards.length)]
    : realCardId;
  const isRealCard = videoCardId === realCardId;
  return {
    videoCardId,
    starDisplay: selectTitleStars(isRealCard),
    isRealCard,
  };
}

export function selectTitleStars(isRealCard: boolean): number {
  const weights = isRealCard ? STAR_WEIGHTS_REAL : STAR_WEIGHTS_FAKE;
  return selectByWeights(weights, 1);
}
