import { buildCommonAssetPath } from '@/lib/gacha/assets';
import { selectStandbyColor } from '@/lib/gacha/common/probabilities';
import type { Rarity, StandbyColor } from '@/lib/gacha/common/types';

const STANDBY_VIDEO_PATHS: Record<StandbyColor, string> = {
  black: buildCommonAssetPath('standby', 'blackstandby.mp4'),
  white: buildCommonAssetPath('standby', 'whitestandby.mp4'),
  yellow: buildCommonAssetPath('standby', 'yellowstandby.mp4'),
  red: buildCommonAssetPath('standby', 'redstandby.mp4'),
  blue: buildCommonAssetPath('standby', 'bluestandby.mp4'),
  rainbow: buildCommonAssetPath('standby', 'rainbowstandby.mp4'),
};

export type StandbySelection = {
  color: StandbyColor;
  videoPath: string;
};

export function chooseStandby(rarity: Rarity): StandbySelection {
  const color = selectStandbyColor(rarity);
  return {
    color,
    videoPath: getStandbyVideoPath(color),
  };
}

export function getStandbyVideoPath(color: StandbyColor): string {
  return STANDBY_VIDEO_PATHS[color];
}
