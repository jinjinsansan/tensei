'use client';

import Image from 'next/image';
import { COUNTDOWN_EFFECTS, type CountdownEffect } from '@/lib/gacha/common/countdown-images';
import type { CdColor } from '@/lib/gacha/common/types';

type Props = {
  imagePath: string;
  color: CdColor;
};

/**
 * カウントダウン静止画表示コンポーネント（アニメーションなし）
 */
export function CountdownImage({ imagePath, color }: Props) {
  const effect: CountdownEffect = COUNTDOWN_EFFECTS[color];

  return (
    <div className="absolute inset-0 z-0 bg-black">
      <div className="relative h-full w-full">
        <Image
          src={imagePath}
          alt="カウントダウン"
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background: `radial-gradient(circle at center, ${effect.glow} 0%, transparent 75%)`,
          }}
        />
      </div>
    </div>
  );
}
