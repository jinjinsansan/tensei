"use client";

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export function SplashGateway() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen overflow-hidden px-6 py-14 text-primary">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_55%)]" />
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/3 to-transparent" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center text-center">
        <motion.div
          className="space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className="flex flex-col items-center gap-6">
              <motion.div
                className="floating-book"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
              <p className="text-[0.85rem] font-semibold uppercase tracking-[0.4em] text-accent">輪廻の書庫</p>
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-widest text-primary">来世ガチャ</h1>
                <p className="text-lg font-medium text-secondary">～もしも生まれ変わったら～</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-secondary">
              雲の上に浮かぶ、果てしない書庫。
              <br />
              一冊の光る本を開けば、あなたの新しい人生が始まります。
            </p>
            <div className="library-divider">─── ✦ ───</div>
          </motion.div>

          <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <button type="button" className="library-button w-full" onClick={() => router.push('/login')}>
              書庫に入る
            </button>
            <button
              type="button"
              className="library-button secondary w-full"
              onClick={() => router.push('/register')}
            >
              入館証を作る
            </button>
          </motion.div>

          <p className="text-xs tracking-[0.35em] text-library-text-secondary">✦ 輪廻の書庫 ✦</p>
        </motion.div>
      </div>
    </div>
  );
}
