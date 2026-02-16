'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { COUNTDOWN_EFFECTS, type CountdownEffect } from '@/lib/gacha/common/countdown-images';
import type { CdColor } from '@/lib/gacha/common/types';

type Props = {
  imagePath: string;
  color: CdColor;
  onAnimationComplete?: () => void;
};

/**
 * カウントダウン静止画表示コンポーネント
 * 色に応じて段階的に強化されるエフェクト
 */
export function CountdownImage({ imagePath, color, onAnimationComplete }: Props) {
  const effect: CountdownEffect = COUNTDOWN_EFFECTS[color];

  return (
    <div className="absolute inset-0 z-0 bg-black">
      {/* メイン画像 */}
      <motion.div
        key={imagePath}
        className="relative h-full w-full"
        initial={{ scale: effect.scale[0], opacity: 0 }}
        animate={{ 
          scale: effect.scale, 
          opacity: 1,
          ...(effect.shake && {
            x: [0, -5, 5, -5, 5, -3, 3, 0],
            rotate: [0, -1, 1, -1, 1, 0],
          })
        }}
        transition={{ 
          duration: effect.duration,
          ease: 'easeOut',
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
        key={`glow-${imagePath}`}
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.6, 0.3] }}
        transition={{ duration: effect.duration }}
        style={{
          background: `radial-gradient(circle at center, ${effect.glow} 0%, transparent 70%)`,
        }}
      />

      {/* パーティクルエフェクト（虹のみ） */}
      {effect.particles && (
        <div key={`particles-${imagePath}`}>
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30) * (Math.PI / 180);
            const distance = 150 + Math.random() * 100;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            return (
              <motion.div
                key={`particle-${i}`}
                className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500"
                initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                animate={{ 
                  x: x, 
                  y: y, 
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{ 
                  duration: 0.6,
                  delay: i * 0.03,
                  ease: 'easeOut',
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
