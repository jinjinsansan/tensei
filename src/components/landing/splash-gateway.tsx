"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AnimationPhase = "shock" | "logo" | "complete";

export function SplashGateway() {
  const router = useRouter();
  const [phase, setPhase] = useState<AnimationPhase>("shock");

  useEffect(() => {
    const timers = [setTimeout(() => setPhase("logo"), 1200), setTimeout(() => setPhase("complete"), 2800)];
    return () => timers.forEach(clearTimeout);
  }, []);

  const heroLines = useMemo(() => ["来世", "GACHA"], []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-hall-background text-white">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute inset-0 bg-hall-grid opacity-35" />
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-neon-pink/30 blur-[220px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-neon-blue/30 blur-[200px]" />
      </div>
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 py-10">
        {phase !== "complete" ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs uppercase tracking-[0.6em] text-neon-yellow"
          >
            LOADING
          </motion.p>
        ) : (
          <motion.div
            className="w-full max-w-sm space-y-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <div className="neon-crest flex h-28 w-28 items-center justify-center rounded-3xl">
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-pink to-neon-blue text-4xl font-bold">
                    来世
                  </div>
                </div>
                <p className="text-[11px] uppercase tracking-[0.55em] text-neon-blue/80">TAP TO ENTER</p>
              </div>
              <div className="space-y-3">
                <div className="font-display text-6xl leading-tight text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.35)]">
                  {heroLines.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
                <p className="text-sm text-white/80">もしも生まれ変わったら～輪廻の書庫へようこそ</p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="h-14 w-full rounded-full bg-gradient-to-r from-[#ff2d95] via-[#ff8c3a] to-[#fff65c] font-display text-sm uppercase tracking-[0.4em] text-[#120714] shadow-[0_0_32px_rgba(255,246,92,0.6)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fff65c]/70"
              >
                タップして入場
              </button>
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="h-12 w-full rounded-full border border-white/20 text-[11px] uppercase tracking-[0.45em] text-white/80 transition hover:border-neon-blue hover:text-white"
              >
                新規登録はこちら
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
