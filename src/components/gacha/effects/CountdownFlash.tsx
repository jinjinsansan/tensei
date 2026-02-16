'use client';

import { motion } from 'framer-motion';

type Props = {
  intensity: number; // 0.0 - 1.0
};

/**
 * カウントダウン切り替え時のフラッシュエフェクト
 */
export function CountdownFlash({ intensity }: Props) {
  return (
    <motion.div
      key={`flash-${Date.now()}`}
      className="pointer-events-none absolute inset-0 z-10 bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, intensity, 0] }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    />
  );
}
