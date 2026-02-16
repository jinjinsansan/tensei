'use client';

import { useMemo } from 'react';
import { COUNTDOWN_EFFECTS, type CountdownEffect } from '@/lib/gacha/common/countdown-images';
import type { CdColor } from '@/lib/gacha/common/types';

type Props = {
  imagePath: string;
  color: CdColor;
};

/**
 * カウントダウン静止画表示コンポーネント（背景描画）
 */
export function CountdownImage({ imagePath, color }: Props) {
  const effect: CountdownEffect = COUNTDOWN_EFFECTS[color];
  const backgroundStyle = useMemo(
    () => ({
      backgroundImage: `url(${imagePath})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }),
    [imagePath],
  );

  return (
    <div className="absolute inset-0 z-0 bg-black">
      <div className="relative h-full w-full overflow-hidden rounded-[12px]" style={backgroundStyle}>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(circle at center, ${effect.glow} 0%, transparent 75%)`,
          }}
        />
      </div>
    </div>
  );
}
