'use client';
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { COUNTDOWN_EFFECTS, FLOAT_IN_ANIMATION, type CountdownEffect } from '@/lib/gacha/common/countdown-images';
import type { CdColor } from '@/lib/gacha/common/types';

type Props = {
  imagePath: string;
  color: CdColor;
  stepIndex: number;
  onAnimationComplete?: () => void;
};

/**
 * カウントダウン静止画表示コンポーネント
 * 色に応じて段階的に強化されるエフェクト
 */
export function CountdownImage({ imagePath, color, stepIndex, onAnimationComplete }: Props) {
  const effect: CountdownEffect = COUNTDOWN_EFFECTS[color];

  return (
    <div className="absolute inset-0 z-0 bg-black">
      {/* メイン画像 */}
      <motion.div
        key={`countdown-main-${stepIndex}`}
        className="relative h-full w-full"
        initial={{ scale: FLOAT_IN_ANIMATION.scale[0], opacity: 0 }}
        animate={{ 
          scale: FLOAT_IN_ANIMATION.scale,
          opacity: FLOAT_IN_ANIMATION.opacity,
        }}
        transition={{ 
          duration: FLOAT_IN_ANIMATION.duration,
          ease: FLOAT_IN_ANIMATION.ease,
        }}
        onAnimationComplete={onAnimationComplete}
        style={{
          filter: `drop-shadow(0 0 40px ${effect.glow})`,
        }}
      >
        <Image
          src={imagePath}
          alt="カウントダウン"
          fill
          className="object-cover"
          priority
          unoptimized
        />
      </motion.div>

      {/* グローエフェクト */}
      <motion.div
        key={`countdown-glow-${stepIndex}`}
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.65, 0.28] }}
        transition={{ duration: FLOAT_IN_ANIMATION.duration, ease: 'easeOut' }}
        style={{
          background: `radial-gradient(circle at center, ${effect.glow} 0%, transparent 70%)`,
        }}
      />
    </div>
  );
}
