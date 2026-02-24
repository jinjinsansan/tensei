"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { RoundMetalButton } from "@/components/gacha/controls/round-metal-button";

type Phase =
  | "STANDBY"   // 待機ループ
  | "TITLE"     // 盛り上がりタイトル
  | "COUNTDOWN" // カウントダウン（10→0）
  | "INSERT_A"  // 差し込みA
  | "INSERT_B"  // 差し込みB
  | "PUCHUN"    // 当たり演出
  | "LOSS"      // ハズレ演出
  | "RESULT";   // 結果表示

const BG_LOOP_VIDEO   = "/videos/harakiri/harakiri_fire_loop.mp4";
const STANDBY_VIDEO   = "/videos/harakiri/harakiri_standby.mp4";
const TITLE_VIDEO     = "/videos/harakiri/harakiri_title.mp4";
const INSERT_A_VIDEO  = "/videos/harakiri/insert_a.mp4";
const INSERT_B_VIDEO  = "/videos/harakiri/insert_b.mp4";
const PUCHUN_VIDEO    = "/videos/common/puchun/puchun.mp4";
const LOSS_VIDEO      = "/videos/harakiri/harakiri_loss.mp4";

const COUNTDOWN_VIDEO_SRC: Partial<Record<number, string>> = {
  8: "/videos/harakiri/countdown_8_fire.mp4",
  7: "/videos/harakiri/countdown_7_fire.mp4",
  6: "/videos/harakiri/countdown_6_fire.mp4",
  5: "/videos/harakiri/countdown_5_fire.mp4",
};

const numSrc = (n: number) => `/harakiri_numbers_red/cd_red_transparent_${n}.png`;

type GachaResult = {
  isWin: boolean;
  stopAt: number; // 10〜0
  showInsertA: boolean;
  showInsertB: boolean;
};

const STOP_AT_WEIGHTS: { value: number; weight: number }[] = [
  { value: 10, weight: 80 },
  { value: 9, weight: 70 },
  { value: 8, weight: 60 },
  { value: 7, weight: 50 },
  { value: 6, weight: 40 },
  { value: 5, weight: 30 },
  { value: 4, weight: 25 },
  { value: 3, weight: 20 },
  { value: 2, weight: 12 },
  { value: 1, weight: 8 },
  { value: 0, weight: 3 },
];

function pickByWeight(values: { value: number; weight: number }[]): number {
  const total = values.reduce((sum, entry) => sum + entry.weight, 0);
  const roll = Math.random() * total;
  let acc = 0;
  for (const entry of values) {
    acc += entry.weight;
    if (roll <= acc) return entry.value;
  }
  return values[values.length - 1]?.value ?? 0;
}

function drawResult(): GachaResult {
  const isWin = Math.random() < 0.45;
  const stopAt = isWin ? pickByWeight(STOP_AT_WEIGHTS) : 0;
  return {
    isWin,
    stopAt,
    showInsertA: Math.random() < 0.45,
    showInsertB: Math.random() < 0.45,
  };
}

type Props = { open: boolean; onClose?: () => void };

export function HarakiriGachaPlayer({ open, onClose }: Props) {
  const target = typeof window === "undefined" ? null : document.body;
  if (!open || !target) return null;
  return createPortal(<ActivePlayer onClose={onClose} />, target);
}

function ActivePlayer({ onClose }: { onClose?: () => void }) {
  const [phase, setPhase] = useState<Phase>("STANDBY");
  const [countdown, setCountdown] = useState(10);
  const [result] = useState<GachaResult>(drawResult);

  const [standbyReady, setStandbyReady] = useState(false);
  const [titleReady, setTitleReady] = useState(false);
  const [countImageReady, setCountImageReady] = useState(false);
  const [countVideoReady, setCountVideoReady] = useState(true);
  const [fgVideoReady, setFgVideoReady] = useState(false);

  const standbyRef = useRef<HTMLVideoElement>(null);
  const bgRef = useRef<HTMLVideoElement>(null);
  const fgRef = useRef<HTMLVideoElement>(null);
  const titleRef = useRef<HTMLVideoElement>(null);
  const countVideoRef = useRef<HTMLVideoElement>(null);

  const countdownVideoSrc = COUNTDOWN_VIDEO_SRC[countdown];
  const countdownReady = countImageReady && countVideoReady;

  const resetCountdownReady = useCallback((nextCount: number) => {
    setCountImageReady(false);
    setCountVideoReady(!COUNTDOWN_VIDEO_SRC[nextCount]);
  }, []);

  const goToPhase = useCallback((next: Phase) => {
    if (next === "INSERT_A" || next === "INSERT_B" || next === "PUCHUN" || next === "LOSS") {
      setFgVideoReady(false);
    }
    if (next === "TITLE") {
      setTitleReady(false);
    }
    setPhase(next);
  }, []);

  const goToCountdown = useCallback((value: number) => {
    resetCountdownReady(value);
    setCountdown(value);
    setPhase("COUNTDOWN");
  }, [resetCountdownReady]);

  // 背景ループは常時再生
  useEffect(() => {
    const v = bgRef.current;
    if (!v) return;
    v.muted = true;
    void v.play().catch(() => undefined);
  }, []);

  // STANDBY ループ
  useEffect(() => {
    const v = standbyRef.current;
    if (!v) return;
    v.muted = true;
    void v.play().catch(() => undefined);
  }, []);

  const fgSrc = useMemo(() => {
    switch (phase) {
      case "INSERT_A": return INSERT_A_VIDEO;
      case "INSERT_B": return INSERT_B_VIDEO;
      case "PUCHUN":   return PUCHUN_VIDEO;
      case "LOSS":     return LOSS_VIDEO;
      default: return null;
    }
  }, [phase]);

  // stopAt で自動プチュン割り込み
  useEffect(() => {
    if (phase !== "COUNTDOWN") return;
    if (!result.isWin) return;
    if (countdown !== result.stopAt) return;
    if (!countdownReady) return;

    const timer = setTimeout(() => goToPhase("PUCHUN"), 120);
    return () => clearTimeout(timer);
  }, [phase, result, countdown, countdownReady, goToPhase]);

  // ボタン押下可否
  const canPress = useMemo(() => {
    switch (phase) {
      case "STANDBY":   return standbyReady;
      case "TITLE":     return titleReady;
      case "COUNTDOWN": return countdownReady;
      case "INSERT_A":
      case "INSERT_B":
      case "PUCHUN":
      case "LOSS":      return fgVideoReady;
      case "RESULT":    return true;
      default: return false;
    }
  }, [phase, standbyReady, titleReady, countdownReady, fgVideoReady]);

  const handleNext = useCallback(() => {
    if (!canPress) return;

    switch (phase) {
      case "STANDBY":
        goToPhase("TITLE");
        return;

      case "TITLE":
        goToCountdown(10);
        return;

      case "COUNTDOWN": {
        const cur = countdown;

        if (result.isWin && cur === result.stopAt) {
          goToPhase("PUCHUN");
          return;
        }

        if (cur === 8 && result.showInsertA) {
          goToPhase("INSERT_A");
          return;
        }

        if (cur === 5 && result.showInsertB) {
          goToPhase("INSERT_B");
          return;
        }

        if (cur > 0) {
          goToCountdown(cur - 1);
          return;
        }

        goToPhase("LOSS");
        return;
      }

      case "INSERT_A":
        goToCountdown(7);
        return;

      case "INSERT_B":
        goToCountdown(4);
        return;

      case "PUCHUN":
      case "LOSS":
        goToPhase("RESULT");
        return;

      case "RESULT":
        onClose?.();
        return;
    }
  }, [canPress, phase, countdown, result, onClose, goToPhase, goToCountdown]);

  // 映像終了時の遷移（挿入は手動、当たり/ハズレは自動）
  const handleFgEnded = useCallback(() => {
    setFgVideoReady(true);
    if (phase === "PUCHUN" || phase === "LOSS") {
      goToPhase("RESULT");
    }
  }, [phase, goToPhase]);

  const preloadNums = useMemo(
    () => Array.from({ length: 11 }, (_, i) => numSrc(i)),
    [],
  );

  return (
    <div className="fixed inset-0 z-[200] bg-black">
      {/* 背景ループ（常時） */}
      <video
        ref={bgRef}
        src={BG_LOOP_VIDEO}
        className="absolute inset-0 h-full w-full object-cover opacity-100"
        loop
        muted
        playsInline
        preload="auto"
      />

      {/* STANDBY ループ */}
      {phase === "STANDBY" && (
        <video
          ref={standbyRef}
          src={STANDBY_VIDEO}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onCanPlayThrough={() => setStandbyReady(true)}
        />
      )}

      {/* TITLE 盛り上がり */}
      {phase === "TITLE" && (
        <video
          ref={titleRef}
          src={TITLE_VIDEO}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          playsInline
          preload="auto"
          onCanPlayThrough={() => setTitleReady(true)}
          onEnded={() => setTitleReady(true)}
        />
      )}

      {/* COUNTDOWN: 背景に炎動画(任意) + 数字PNG */}
      {phase === "COUNTDOWN" && countdownVideoSrc && (
        <video
          key={countdownVideoSrc}
          ref={countVideoRef}
          src={countdownVideoSrc}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          playsInline
          preload="auto"
          onCanPlayThrough={() => setCountVideoReady(true)}
          onEnded={() => setCountVideoReady(true)}
        />
      )}

      {phase === "COUNTDOWN" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            key={countdown}
            src={numSrc(countdown)}
            alt={`${countdown}`}
            className="h-[78vh] w-auto drop-shadow-[0_0_24px_rgba(255,70,70,0.9)] animate-[vvvIn_0.22s_ease-out_forwards]"
            onLoad={() => setCountImageReady(true)}
          />
        </div>
      )}

      {/* INSERT_A / INSERT_B / PUCHUN / LOSS */}
      {fgSrc && (
        <video
          key={fgSrc}
          ref={fgRef}
          src={fgSrc}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          playsInline
          preload="auto"
          onCanPlayThrough={() => setFgVideoReady(true)}
          onEnded={handleFgEnded}
        />
      )}

      {/* RESULT */}
      {phase === "RESULT" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/80">
          <p className="text-xs uppercase tracking-[0.6em] text-red-300">VVV GACHA</p>
          <p className="text-5xl font-extrabold text-white drop-shadow-[0_0_28px_rgba(255,80,80,1)]">
            {result.isWin ? "当たり" : "ハズレ"}
          </p>
          <RoundMetalButton label="CLOSE" subLabel="戻る" onClick={onClose} />
        </div>
      )}

      {/* ボタン（3つ同動作） */}
      {phase !== "RESULT" && (
        <div className="absolute bottom-10 left-0 right-0 z-20 flex items-center justify-center gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <RoundMetalButton
              key={idx}
              label={phase === "STANDBY" ? "VVV" : "NEXT"}
              subLabel={phase === "STANDBY" ? "START" : phase === "COUNTDOWN" ? `${countdown}` : ""}
              onClick={handleNext}
              disabled={!canPress}
            />
          ))}
        </div>
      )}

      {/* プリロード */}
      <div aria-hidden className="hidden">
        {preloadNums.map((src) => <img key={src} src={src} alt="" />)}
        <video src={PUCHUN_VIDEO} preload="auto" />
        <video src={LOSS_VIDEO} preload="auto" />
        <video src={INSERT_A_VIDEO} preload="auto" />
        <video src={INSERT_B_VIDEO} preload="auto" />
        <video src={TITLE_VIDEO} preload="auto" />
        <video src={STANDBY_VIDEO} preload="auto" />
        {Object.values(COUNTDOWN_VIDEO_SRC).map((src) => src && <video key={src} src={src} preload="auto" />)}
      </div>

      <style>{`
        @keyframes vvvIn {
          from { opacity: 0; transform: translateY(12px) scale(1.04); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
