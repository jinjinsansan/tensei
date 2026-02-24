"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { RoundMetalButton } from "@/components/gacha/controls/round-metal-button";

type HarakiriPhase = "STANDBY" | "PLAYING" | "DONE";

const BG_LOOP = "/videos/harakiri/harakiri_fire_loop.mp4";
const MAIN_VIDEO = "/videos/harakiri/harakiri_full.mp4";

type Props = {
  open: boolean;
  onClose?: () => void;
};

export function HarakiriGachaPlayer({ open, onClose }: Props) {
  const portalTarget = typeof window === "undefined" ? null : document.body;
  if (!open || !portalTarget) return null;
  return createPortal(<ActiveHarakiriPlayer onClose={onClose} />, portalTarget);
}

function ActiveHarakiriPlayer({ onClose }: { onClose?: () => void }) {
  const [phase, setPhase] = useState<HarakiriPhase>("STANDBY");
  const [countdown, setCountdown] = useState(10);
  const [bgReady, setBgReady] = useState(false);
  const [fgReady, setFgReady] = useState(false);
  const [countVisible, setCountVisible] = useState(false);

  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const fgVideoRef = useRef<HTMLVideoElement>(null);

  const currentFgSrc = useMemo(() => (phase === "PLAYING" ? MAIN_VIDEO : null), [phase]);

  // 背景動画は常時ループ
  useEffect(() => {
    const v = bgVideoRef.current;
    if (!v) return;
    v.muted = true;
    void v.play().catch(() => undefined);
  }, []);

  // 前景動画再生
  useEffect(() => {
    const v = fgVideoRef.current;
    if (!v || !currentFgSrc) return;
    v.muted = true;
    void v.play().catch(() => undefined);
  }, [currentFgSrc]);

  const handleImageLoad = useCallback(() => setCountVisible(true), []);

  const ready = useMemo(() => {
    if (phase === "PLAYING") return bgReady && fgReady;
    return bgReady;
  }, [phase, bgReady, fgReady]);

  const handleNext = useCallback(() => {
    if (!ready) return;
    switch (phase) {
      case "STANDBY":
        setPhase("PLAYING");
        setCountdown(10);
        setCountVisible(false);
        setFgReady(false);
        return;
      case "PLAYING":
        return;
      case "DONE":
        onClose?.();
        return;
    }
  }, [ready, phase, onClose]);

  // 画像プリロード
  const preloadImages = useMemo(
    () =>
      Array.from({ length: 11 }).map((_, idx) => `/harakiri_numbers/countdown_${idx}.png`),
    [],
  );

  // カウントダウンタイマー（PLAYING開始時に走らせる）
  useEffect(() => {
    if (phase !== "PLAYING") return;
    setCountVisible(true);
    setCountdown(10);
    let current = 10;
    const timer = setInterval(() => {
      current -= 1;
      setCountdown(current);
      if (current < 0) {
        setCountVisible(false);
        clearInterval(timer);
      }
    }, 800);
    return () => clearInterval(timer);
  }, [phase]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black">
      <div className="absolute inset-0">
        <video
          ref={bgVideoRef}
          src={BG_LOOP}
          className="h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onCanPlayThrough={() => setBgReady(true)}
        />
        {currentFgSrc && (
          <video
            key={currentFgSrc}
            ref={fgVideoRef}
            src={currentFgSrc}
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            playsInline
            preload="auto"
            onCanPlayThrough={() => setFgReady(true)}
            onEnded={() => setPhase("DONE")}
          />
        )}
      </div>

      {/* 数字レイヤー */}
      {phase === "PLAYING" && countVisible && countdown >= 0 && (
        <div className="relative z-10 flex items-center justify-center">
          <img
            key={countdown}
            src={`/harakiri_numbers/countdown_${countdown}.png`}
            alt={`countdown-${countdown}`}
            className="h-[72vh] w-auto animate-[slideIn_0.25s_cubic-bezier(0.34,1.56,0.64,1)_forwards] drop-shadow-[0_0_30px_rgba(255,220,120,0.8)]"
            onLoad={handleImageLoad}
          />
        </div>
      )}

      {/* 結果フェーズの簡易表示 */}
      {phase === "DONE" && (
        <div className="relative z-20 flex flex-col items-center gap-4 rounded-3xl bg-black/70 px-8 py-6 text-white shadow-[0_0_40px_rgba(255,120,170,0.4)]">
          <p className="text-lg font-bold tracking-[0.3em]">VVV GACHA</p>
          <p className="text-3xl font-extrabold text-amber-300 drop-shadow-[0_0_18px_rgba(255,200,100,0.8)]">ハラキリ完了</p>
          <RoundMetalButton label="CLOSE" subLabel="戻る" onClick={onClose} />
        </div>
      )}

      {/* ボタン（1つ） */}
      <div className="absolute bottom-10 left-0 right-0 z-20 flex items-center justify-center">
        <RoundMetalButton
          label={phase === "STANDBY" ? "VVV" : "STOP"}
          subLabel={phase === "STANDBY" ? "START" : ""}
          onClick={handleNext}
          disabled={!ready}
        />
      </div>

      {/* プリロード */}
      <div aria-hidden className="hidden">
        {preloadImages.map((src) => (
          <img key={src} src={src} alt="" />
        ))}
        <video src={MAIN_VIDEO} preload="auto" />
      </div>

      <style>{`
        @keyframes slideIn {
          0% { transform: translateX(120vw) scale(0.9); opacity: 0; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
