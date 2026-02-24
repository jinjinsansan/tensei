"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { RoundMetalButton } from "@/components/gacha/controls/round-metal-button";

type Phase =
  | "STANDBY"   // harakiri_standby.mp4 ループ
  | "COUNTDOWN" // cd_red_transparent_N.png フル画面表示、ボタン1回=1コマ
  | "INSERT_A"  // 差し込みA映像（素材未提供→スキップ）
  | "INSERT_B"  // 差し込みB映像（素材未提供→スキップ）
  | "PUCHUN"    // 当たり演出映像
  | "LOSS"      // ハズレ映像
  | "RESULT";   // 結果表示

const STANDBY_VIDEO  = "/videos/harakiri/harakiri_standby.mp4";
const INSERT_A_VIDEO = "/videos/harakiri/insert_a.mp4";
const INSERT_B_VIDEO = "/videos/harakiri/insert_b.mp4";
const PUCHUN_VIDEO   = "/videos/common/puchun/puchun.mp4";
const LOSS_VIDEO     = "/videos/harakiri/harakiri_loss.mp4";

const numSrc = (n: number) => `/harakiri_numbers_red/cd_red_transparent_${n}.png`;

type GachaResult = {
  isWin: boolean;
  stopAt: number;    // 当たりカウント（1〜10）
  showInsertA: boolean;
  showInsertB: boolean;
};

function drawResult(): GachaResult {
  const isWin = Math.random() < 0.3;
  return {
    isWin,
    stopAt: isWin
      ? Math.floor(Math.random() * 10) + 1  // 1〜10
      : 0,
    showInsertA: false, // 素材提供後に有効化
    showInsertB: false,
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

  // ready フラグ
  const [standbyReady, setStandbyReady] = useState(false);
  const [numReady, setNumReady] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  const standbyRef = useRef<HTMLVideoElement>(null);
  const fgRef = useRef<HTMLVideoElement>(null);

  // STANDBY 映像ループ
  useEffect(() => {
    const v = standbyRef.current;
    if (!v) return;
    v.muted = true;
    void v.play().catch(() => undefined);
  }, []);

  // フェーズが変わったら映像 ready をリセット
  useEffect(() => {
    if (phase !== "STANDBY" && phase !== "COUNTDOWN") {
      setVideoReady(false);
    }
  }, [phase]);

  // 現フェーズに対応する映像ソース
  const fgSrc = useMemo(() => {
    switch (phase) {
      case "INSERT_A": return INSERT_A_VIDEO;
      case "INSERT_B": return INSERT_B_VIDEO;
      case "PUCHUN":   return PUCHUN_VIDEO;
      case "LOSS":     return LOSS_VIDEO;
      default: return null;
    }
  }, [phase]);

  // ボタン押下可否
  const canPress = useMemo(() => {
    switch (phase) {
      case "STANDBY":   return standbyReady;
      case "COUNTDOWN": return numReady;
      case "INSERT_A":
      case "INSERT_B":
      case "PUCHUN":
      case "LOSS":      return videoReady;
      case "RESULT":    return true;
      default: return false;
    }
  }, [phase, standbyReady, numReady, videoReady]);

  const handleNext = useCallback(() => {
    if (!canPress) return;

    switch (phase) {
      case "STANDBY":
        setCountdown(10);
        setNumReady(false);
        setPhase("COUNTDOWN");
        return;

      case "COUNTDOWN": {
        const cur = countdown;

        // 当たり判定
        if (result.isWin && cur === result.stopAt) {
          setPhase("PUCHUN");
          return;
        }

        // 差し込みA（8のタイミング）
        if (cur === 8 && result.showInsertA) {
          setPhase("INSERT_A");
          return;
        }

        // 差し込みB（5のタイミング）
        if (cur === 5 && result.showInsertB) {
          setPhase("INSERT_B");
          return;
        }

        if (cur > 0) {
          setNumReady(false);
          setCountdown(cur - 1);
          return;
        }

        // 0 到達→ハズレ
        setPhase("LOSS");
        return;
      }

      case "INSERT_A":
        setNumReady(false);
        setCountdown(7);
        setPhase("COUNTDOWN");
        return;

      case "INSERT_B":
        setNumReady(false);
        setCountdown(4);
        setPhase("COUNTDOWN");
        return;

      case "PUCHUN":
      case "LOSS":
        setPhase("RESULT");
        return;

      case "RESULT":
        onClose?.();
        return;
    }
  }, [canPress, phase, countdown, result, onClose]);

  // プリロード
  const preloadNums = useMemo(
    () => Array.from({ length: 11 }, (_, i) => numSrc(i)),
    [],
  );

  return (
    <div className="fixed inset-0 z-[200] bg-black">

      {/* STANDBY: 映像ループ */}
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

      {/* COUNTDOWN: PNG をフル画面表示 */}
      {phase === "COUNTDOWN" && (
        <img
          key={countdown}
          src={numSrc(countdown)}
          alt={`${countdown}`}
          className="absolute inset-0 h-full w-full object-cover animate-[vvvIn_0.18s_ease-out_forwards]"
          onLoad={() => setNumReady(true)}
        />
      )}

      {/* INSERT_A / INSERT_B / PUCHUN / LOSS: 映像フル画面 */}
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
          onCanPlayThrough={() => setVideoReady(true)}
          onEnded={() => setVideoReady(true)}
        />
      )}

      {/* RESULT: 仮表示 */}
      {phase === "RESULT" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black">
          <p className="text-2xl font-bold tracking-[0.3em] text-red-300">VVV GACHA</p>
          <p className="text-5xl font-extrabold text-white drop-shadow-[0_0_24px_rgba(255,80,80,1)]">
            {result.isWin ? "当たり" : "ハズレ"}
          </p>
          <RoundMetalButton label="CLOSE" subLabel="戻る" onClick={onClose} />
        </div>
      )}

      {/* ボタン */}
      {phase !== "RESULT" && (
        <div className="absolute bottom-10 left-0 right-0 z-20 flex items-center justify-center">
          <RoundMetalButton
            label={phase === "STANDBY" ? "VVV" : "NEXT"}
            subLabel={phase === "STANDBY" ? "START" : phase === "COUNTDOWN" ? `${countdown}` : ""}
            onClick={handleNext}
            disabled={!canPress}
          />
        </div>
      )}

      {/* プリロード */}
      <div aria-hidden className="hidden">
        {preloadNums.map((src) => <img key={src} src={src} alt="" />)}
        <video src={PUCHUN_VIDEO}   preload="auto" />
        <video src={LOSS_VIDEO}     preload="auto" />
        <video src={INSERT_A_VIDEO} preload="auto" />
        <video src={INSERT_B_VIDEO} preload="auto" />
      </div>

      <style>{`
        @keyframes vvvIn {
          from { opacity: 0; transform: scale(1.08); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
