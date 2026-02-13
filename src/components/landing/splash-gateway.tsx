"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type AnimationPhase = "first" | "shuffle" | "last" | "logo" | "complete";

const SHUFFLE_CARDS = [
  "/kenta_cards/card02_warehouse.png",
  "/kenta_cards/card03_youtuber.png",
  "/kenta_cards/card04_civil_servant.png",
  "/kenta_cards/card05_ramen.png",
  "/kenta_cards/card06_boxer.png",
  "/kenta_cards/card07_surgeon.png",
  "/kenta_cards/card08_business_owner.png",
  "/kenta_cards/card09_mercenary.png",
  "/kenta_cards/card10_rockstar.png",
  "/kenta_cards/card11_demon_king.png",
];

export function SplashGateway() {
  const router = useRouter();
  const [phase, setPhase] = useState<AnimationPhase>("first");
  const [currentShuffleCard, setCurrentShuffleCard] = useState(SHUFFLE_CARDS[0]);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("shuffle"), 500),
      setTimeout(() => setPhase("last"), 2500),
      setTimeout(() => setPhase("logo"), 3000),
      setTimeout(() => setPhase("complete"), 4500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase !== "shuffle") return;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * SHUFFLE_CARDS.length);
      setCurrentShuffleCard(SHUFFLE_CARDS[randomIndex]);
    }, 50);
    return () => clearInterval(interval);
  }, [phase]);

  const heroLines = useMemo(() => ["来世", "GACHA"], []);

  const showFirst = phase === "first";
  const showShuffle = phase === "shuffle";
  const showLast = phase === "last";
  const showLogo = phase === "logo";

  return (
    <div className="relative min-h-screen overflow-hidden bg-hall-background text-white">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute inset-0 bg-hall-grid opacity-35" />
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-neon-pink/30 blur-[220px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-neon-blue/30 blur-[200px]" />
      </div>
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 py-10">
        {phase !== "complete" && (
          <div className="relative flex h-[62vh] w-full items-center justify-center overflow-hidden rounded-[32px] border border-white/10 bg-black/30 shadow-[0_0_45px_rgba(0,0,0,0.5)]">
            {/* First Card */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={showFirst ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Image
                src="/kenta_cards/card01_convenience.png"
                alt="来世ガチャ"
                fill
                priority
                className="object-cover"
              />
            </motion.div>

            {/* Shuffle Cards */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={showShuffle ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              <Image
                src={currentShuffleCard}
                alt="シャッフル中"
                fill
                className="object-cover"
              />
            </motion.div>

            {/* Last Card */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={showLast ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Image
                src="/kenta_cards/card12_hero.png"
                alt="来世ガチャ"
                fill
                className="object-cover"
              />
            </motion.div>

            {/* Logo Overlay */}
            <motion.div
              className="absolute flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={showLogo ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="relative">
                <div className="absolute inset-0 -z-10 rounded-[36px] bg-neon-pink/30 blur-3xl" />
                <div className="neon-crest">
                  <Image
                    src="/icon-large.png"
                    alt="RAISE GACHA"
                    width={260}
                    height={260}
                    priority
                    className="h-56 w-56 rounded-[22px] object-cover shadow-[0_0_45px_rgba(255,255,255,0.4)]"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Loading Text / Hero */}
        {phase !== "complete" ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 text-xs uppercase tracking-[0.6em] text-neon-yellow"
          >
            LOADING
          </motion.p>
        ) : (
          <motion.div
            className="mt-0 w-full max-w-sm space-y-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <div className="neon-crest">
                  <Image
                    src="/icon.png"
                    alt="RAISE GACHA"
                    width={128}
                    height={128}
                    className="h-28 w-28 rounded-3xl object-cover shadow-[0_0_35px_rgba(255,255,255,0.25)]"
                  />
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
