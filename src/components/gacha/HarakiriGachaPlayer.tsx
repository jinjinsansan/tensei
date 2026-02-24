"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { RoundMetalButton } from "@/components/gacha/controls/round-metal-button";

type HarakiriPhase =
  | "STANDBY"
  | "TITLE"
  | "COUNTDOWN"
  | "INSERT_A"
  | "INSERT_B"
  | "PUCHUN"
  | "LOSS"
  | "CARD_REVEAL";

type HarakiriResult = {
  isWin: boolean;
  stopAt: number; // 0-10, where PUCHUN will trigger
  showInsertA: boolean;
  showInsertB: boolean;
};

const BG_LOOP = "/videos/harakiri/harakiri_fire_loop.mp4";
const TITLE_VIDEO = "/videos/harakiri/harakiri_title.mp4";
const INSERT_A_VIDEO = "/videos/harakiri/insert_a.mp4";
const INSERT_B_VIDEO = "/videos/harakiri/insert_b.mp4";
const LOSS_VIDEO = "/videos/harakiri/harakiri_loss.mp4";
const PUCHUN_VIDEO = "/videos/common/puchun/puchun.mp4";

function generateResult(): HarakiriResult {
  const winProb = 0.3; // 30% 当たり（後で設定化可）
  const isWin = Math.random() < winProb;
  if (isWin) {
    // 当たりは短めで止まりやすく設定
    const candidates = [7, 6, 5, 4, 3];
    const stopAt = candidates[Math.floor(Math.random() * candidates.length)];
    return {
      isWin: true,
      stopAt,
      showInsertA: stopAt >= 7,
      showInsertB: stopAt >= 4,
    };
  }
  return {
    isWin: false,
    stopAt: 0,
    showInsertA: Math.random() < 0.3,
    showInsertB: Math.random() < 0.2,
  };
}

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
  const [result] = useState<HarakiriResult>(() => generateResult());
  const [bgReady, setBgReady] = useState(false);
  const [imgReady, setImgReady] = useState(false);
  const [fgReadySrc, setFgReadySrc] = useState<string | null>(null);

  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const fgVideoRef = useRef<HTMLVideoElement>(null);

  const currentFgSrc = useMemo(() => {
    switch (phase) {
      case "TITLE":
        return TITLE_VIDEO;
      case "INSERT_A":
        return INSERT_A_VIDEO;
      case "INSERT_B":
        return INSERT_B_VIDEO;
      case "PUCHUN":
        return PUCHUN_VIDEO;
      case "LOSS":
        return LOSS_VIDEO;
      default:
        return null;
    }
  }, [phase]);

  // 背景動画は常時ループ
  useEffect(() => {
    const v = bgVideoRef.current;
    if (!v) return;
    v.muted = true;
    void v.play().catch(() => undefined);
  }, []);

  const fgVideoKey = useMemo(() => (currentFgSrc ? `${phase}-${countdown}-${currentFgSrc}` : null), [currentFgSrc, phase, countdown]);

  // 前景動画再生
  useEffect(() => {
    const v = fgVideoRef.current;
    if (!v || !currentFgSrc) return;
    v.muted = true;
    void v.play().catch(() => undefined);
  }, [currentFgSrc, phase, countdown]);

  const handleImageLoad = useCallback(() => setImgReady(true), []);

  const ready = useMemo(() => {
    if (phase === "TITLE" || phase === "INSERT_A" || phase === "INSERT_B" || phase === "PUCHUN" || phase === "LOSS") {
      return currentFgSrc !== null && fgReadySrc === currentFgSrc;
    }
    if (phase === "COUNTDOWN") return bgReady && imgReady;
    return bgReady;
  }, [phase, fgReadySrc, currentFgSrc, bgReady, imgReady]);

  const handleNext = useCallback(() => {
    if (!ready) return;
    switch (phase) {
      case "STANDBY":
        setPhase("TITLE");
        return;
      case "TITLE":
        setPhase("COUNTDOWN");
        setCountdown(10);
        setImgReady(false);
        return;
      case "INSERT_A":
        setPhase("COUNTDOWN");
        setCountdown(7);
        setImgReady(false);
        return;
      case "INSERT_B":
        setPhase("COUNTDOWN");
        setCountdown(4);
        setImgReady(false);
        return;
      case "PUCHUN":
      case "LOSS":
        setPhase("CARD_REVEAL");
        return;
      case "CARD_REVEAL":
        onClose?.();
        return;
      case "COUNTDOWN": {
        // 当たり判定
        if (result.isWin && countdown === result.stopAt) {
          setPhase("PUCHUN");
          return;
        }

        // 差し込み
        if (countdown === 8 && result.showInsertA) {
          setPhase("INSERT_A");
          return;
        }
        if (countdown === 5 && result.showInsertB) {
          setPhase("INSERT_B");
          return;
        }

        if (countdown > 0) {
          setCountdown((c) => c - 1);
          setImgReady(false);
          return;
        }

        // 0 到達
        if (result.isWin) {
          setPhase("PUCHUN");
        } else {
          setPhase("LOSS");
        }
        return;
      }
    }
  }, [ready, phase, result, countdown, onClose]);

  // 画像プリロード
  const preloadImages = useMemo(
    () =>
      Array.from({ length: 11 }).map((_, idx) => `/harakiri_numbers/countdown_${idx}.png`),
    [],
  );

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
            key={fgVideoKey ?? currentFgSrc}
            ref={fgVideoRef}
            src={currentFgSrc}
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            playsInline
            preload="auto"
            onCanPlayThrough={() => setFgReadySrc(currentFgSrc)}
          />
        )}
      </div>

      {/* 数字レイヤー */}
      {phase === "COUNTDOWN" && (
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
      {phase === "CARD_REVEAL" && (
        <div className="relative z-20 flex flex-col items-center gap-4 rounded-3xl bg-black/70 px-8 py-6 text-white shadow-[0_0_40px_rgba(255,120,170,0.4)]">
          <p className="text-lg font-bold tracking-[0.3em]">VVV GACHA RESULT</p>
          <p className="text-3xl font-extrabold text-amber-300 drop-shadow-[0_0_18px_rgba(255,200,100,0.8)]">{result.isWin ? "当たり" : "ハズレ"}</p>
          <RoundMetalButton label="CLOSE" subLabel="戻る" onClick={onClose} />
        </div>
      )}

      {/* ボタン */}
      <div className="absolute bottom-10 left-0 right-0 z-20 flex items-center justify-center gap-4">
        <RoundMetalButton
          label="LEFT"
          subLabel="◀ 次へ"
          onClick={handleNext}
          disabled={!ready || phase === "CARD_REVEAL"}
        />
        <RoundMetalButton
          label="CENTER"
          subLabel="進む"
          onClick={handleNext}
          disabled={!ready || phase === "CARD_REVEAL"}
        />
        <RoundMetalButton
          label="RIGHT"
          subLabel="次へ ▶"
          onClick={handleNext}
          disabled={!ready || phase === "CARD_REVEAL"}
        />
      </div>

      {/* プリロード */}
      <div aria-hidden className="hidden">
        {preloadImages.map((src) => (
          <img key={src} src={src} alt="" />
        ))}
        <video src={TITLE_VIDEO} preload="auto" />
        <video src={INSERT_A_VIDEO} preload="auto" />
        <video src={INSERT_B_VIDEO} preload="auto" />
        <video src={PUCHUN_VIDEO} preload="auto" />
        <video src={LOSS_VIDEO} preload="auto" />
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
