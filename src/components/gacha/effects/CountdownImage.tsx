'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
  const rafRef = useRef<number | null>(null);
  const backgroundStyle = useMemo(
    () => ({
      backgroundImage: `url(${imagePath})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }),
    [imagePath],
  );

  useEffect(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    setIsVisible(false);
    const id = requestAnimationFrame(() => setIsVisible(true));
    rafRef.current = id;
    return () => {
      cancelAnimationFrame(id);
      setIsVisible(false);
      rafRef.current = null;
    };
  }, [imagePath]);

  return (
    <div className="absolute inset-0 z-0 bg-black">
      <div
        className={`relative h-full w-full overflow-hidden rounded-[18px] bg-black/30 transition-[opacity,transform] duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.08]'
        }`}
        style={backgroundStyle}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(circle at center, ${effect.glow} 0%, transparent 75%)`,
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
      </div>
    </div>
  );
}
