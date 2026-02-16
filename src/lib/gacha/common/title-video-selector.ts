import { selectByWeights } from '@/lib/gacha/common/probabilities';
import type { TitleVideoSelection } from '@/lib/gacha/common/types';

const DEFAULT_HINT_RATE = 60; // %

const STAR_WEIGHTS_REAL = [5, 10, 15, 35, 35];
const STAR_WEIGHTS_FAKE = [30, 30, 20, 15, 5];

export function chooseTitleVideo(
  realCardId: string,
  allCardIds: string[],
  hintRatePercent: number = DEFAULT_HINT_RATE,
): TitleVideoSelection {
  const clamped = Number.isFinite(hintRatePercent)
    ? Math.min(Math.max(hintRatePercent, 0), 100)
    : DEFAULT_HINT_RATE;
  const shouldUseReal = Math.random() < clamped / 100;
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
