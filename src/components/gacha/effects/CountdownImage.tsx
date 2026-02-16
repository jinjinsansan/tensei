'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const [isVisible, setIsVisible] = useState(false);
  const backgroundStyle = useMemo(
    () => ({
      backgroundImage: `url(${imagePath})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }),
    [imagePath],
  );

  useEffect(() => {
    let hideFrame: number | null = null;
    let showFrame: number | null = null;

    hideFrame = requestAnimationFrame(() => {
      setIsVisible(false);
      showFrame = requestAnimationFrame(() => setIsVisible(true));
    });

    return () => {
      if (hideFrame) {
        cancelAnimationFrame(hideFrame);
      }
      if (showFrame) {
        cancelAnimationFrame(showFrame);
      }
    };
  }, [imagePath]);

  return (
    <div className="absolute inset-0 z-0 bg-black">
      <div
        className={`relative h-full w-full overflow-hidden rounded-[22px] bg-black/20 shadow-[0_25px_60px_rgba(0,0,0,0.65)] transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] will-change-transform ${
          isVisible ? 'opacity-100 scale-100 blur-0 saturate-100' : 'opacity-0 scale-[0.72] blur-[8px] saturate-50'
        }`}
        style={backgroundStyle}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(circle at center, ${effect.glow} 0%, transparent 75%)`,
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/60" />
        <div className="pointer-events-none absolute inset-0 mix-blend-screen opacity-20" style={{ background: 'radial-gradient(circle at top, rgba(255,255,255,0.8), transparent 55%)' }} />
      </div>
    </div>
  );
}
