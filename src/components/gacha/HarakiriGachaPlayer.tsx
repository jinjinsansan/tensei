"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { RoundMetalButton } from "@/components/gacha/controls/round-metal-button";

// ─── フェーズ定義 ───────────────────────────────────────────────
type Phase =
  | "STANDBY"      // 待機ループ
  | "COUNTDOWN"    // カウントダウン（10→0）、ボタン1回=1コマ
  | "INSERT_A"     // 差し込みA映像（7〜8間）
  | "INSERT_B"     // 差し込みB映像（4〜5間）
  | "PUCHUN"       // 当たり演出（プチュン映像）
  | "LOSS"         // ハズレ映像
  | "RESULT";      // 結果表示（仮カード）

// ─── アセットパス ────────────────────────────────────────────────
const STANDBY_VIDEO  = "/videos/harakiri/harakiri_standby.mp4";
const BG_LOOP        = "/videos/harakiri/harakiri_fire_loop.mp4";
const INSERT_A_VIDEO = "/videos/harakiri/insert_a.mp4";
const INSERT_B_VIDEO = "/videos/harakiri/insert_b.mp4";
const PUCHUN_VIDEO   = "/videos/common/puchun/puchun.mp4";
const LOSS_VIDEO     = "/videos/harakiri/harakiri_loss.mp4";

const RED_NUM = (n: number) => `/harakiri_numbers_red/cd_red_transparent_${n}.png`;

// ─── 抽選ロジック ────────────────────────────────────────────────
type GachaResult = {
  isWin: boolean;
  stopAt: number;  // 当たりの場合にプチュンを出すカウント値（1〜10）
  showInsertA: boolean;  // 8→7のタイミングで差し込みA
  showInsertB: boolean;  // 5→4のタイミングで差し込みB
};

function drawResult(): GachaResult {
  const isWin = Math.random() < 0.3;
  if (isWin) {
    const candidates = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    const stopAt = candidates[Math.floor(Math.random() * candidates.length)];
    return {
      isWin: true,
      stopAt,
      showInsertA: false, // 差し込みは素材が揃ってから有効化
      showInsertB: false,
    };
  }
  return {
    isWin: false,
    stopAt: 0,
    showInsertA: false,
    showInsertB: false,
  };
}

// ─── Props ───────────────────────────────────────────────────────
type Props = {
  open: boolean;
  onClose?: () => void;
};

export function HarakiriGachaPlayer({ open, onClose }: Props) {
  const portalTarget = typeof window === "undefined" ? null : document.body;
  if (!open || !portalTarget) return null;
  return createPortal(<ActivePlayer onClose={onClose} />, portalTarget);
}

// ─── メインプレイヤー ────────────────────────────────────────────
function ActivePlayer({ onClose }: { onClose?: () => void }) {
  const [phase, setPhase] = useState<Phase>("STANDBY");
  const [countdown, setCountdown] = useState(10);
  const [result] = useState<GachaResult>(drawResult);

  // 各動画のready状態
  const [standbyReady, setStandbyReady] = useState(false);
  const [bgReady, setBgReady] = useState(false);
  const [fgReady, setFgReady] = useState(false);

  // 数字PNGのロード状態
  const [numReady, setNumReady] = useState(false);

  const standbyRef = useRef<HTMLVideoElement>(null);
  const bgRef      = useRef<HTMLVideoElement>(null);
  const fgRef      = useRef<HTMLVideoElement>(null);

  // ─── STANDBY映像ループ再生 ──────────────────────────────────────
  useEffect(() => {
    const v = standbyRef.current;
    if (!v) return;
    v.muted = true;
    void v.play().catch(() => undefined);
  }, []);

  // ─── BG炎ループ再生（COUNTDOWN以降） ──────────────────────────
  useEffect(() => {
    if (phase === "STANDBY") return;
    const v = bgRef.current;
    if (!v) return;
    v.muted = true;
    void v.play().catch(() => undefined);
  }, [phase]);

  // ─── FG映像（差し込み/プチュン/ハズレ）の再生 ─────────────────
  const fgSrc = useMemo(() => {
    switch (phase) {
      case "INSERT_A": return INSERT_A_VIDEO;
      case "INSERT_B": return INSERT_B_VIDEO;
      case "PUCHUN":   return PUCHUN_VIDEO;
      case "LOSS":     return LOSS_VIDEO;
      default: return null;
    }
  }, [phase]);

  useEffect(() => {
    const v = fgRef.current;
    if (!v || !fgSrc) return;
    setFgReady(false);
    v.load();
    void v.play().catch(() => undefined);
  }, [fgSrc]);

  // ─── ボタンが押せる条件 ─────────────────────────────────────────
  const canPress = useMemo(() => {
    if (phase === "STANDBY")   return standbyReady;
    if (phase === "COUNTDOWN") return bgReady && numReady;
    if (phase === "INSERT_A" || phase === "INSERT_B") return fgReady;
    if (phase === "PUCHUN" || phase === "LOSS")       return fgReady;
    if (phase === "RESULT")    return true;
    return false;
  }, [phase, standbyReady, bgReady, numReady, fgReady]);

  // ─── ボタン押下ハンドラ ─────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (!canPress) return;

    switch (phase) {
      case "STANDBY":
        // カウントダウン開始
        setCountdown(10);
        setNumReady(false);
        setPhase("COUNTDOWN");
        return;

      case "COUNTDOWN": {
        const cur = countdown;

        // 当たり：このカウントでプチュン
        if (result.isWin && cur === result.stopAt) {
          setFgReady(false);
          setPhase("PUCHUN");
          return;
        }

        // 差し込みA（8→7の間）
        if (cur === 8 && result.showInsertA) {
          setFgReady(false);
          setPhase("INSERT_A");
          return;
        }

        // 差し込みB（5→4の間）
        if (cur === 5 && result.showInsertB) {
          setFgReady(false);
          setPhase("INSERT_B");
          return;
        }

        if (cur > 0) {
          setNumReady(false);
          setCountdown(cur - 1);
          return;
        }

        // カウント0到達→ハズレ
        setFgReady(false);
        setPhase("LOSS");
        return;
      }

      case "INSERT_A":
        // 差し込みA後は差し込みが入った数字（7）に戻す
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

  // ─── FG映像終了で自動進行（差し込み映像は終わったら自動的にボタン押下可に） ──
  const handleFgEnded = useCallback(() => {
    setFgReady(true);
  }, []);

  // ─── プリロード用画像リスト ─────────────────────────────────────
  const preloadNums = useMemo(
    () => Array.from({ length: 11 }, (_, i) => RED_NUM(i)),
    [],
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black">

      {/* ── STANDBY映像（待機中のみ表示） ── */}
      <div className={`absolute inset-0 ${phase === "STANDBY" ? "block" : "hidden"}`}>
        <video
          ref={standbyRef}
          src={STANDBY_VIDEO}
          className="h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onCanPlayThrough={() => setStandbyReady(true)}
        />
      </div>

      {/* ── BG炎ループ（COUNTDOWN以降で表示） ── */}
      <div className={`absolute inset-0 ${phase !== "STANDBY" ? "block" : "hidden"}`}>
        <video
          ref={bgRef}
          src={BG_LOOP}
          className="h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onCanPlayThrough={() => setBgReady(true)}
        />

        {/* FG映像（差し込み/プチュン/ハズレ） */}
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
            onCanPlayThrough={() => setFgReady(true)}
            onEnded={handleFgEnded}
          />
        )}
      </div>

      {/* ── 数字PNG（COUNTDOWNフェーズ） ── */}
      {phase === "COUNTDOWN" && (
        <div className="relative z-10 flex items-center justify-center">
          <img
            key={countdown}
            src={RED_NUM(countdown)}
            alt={`${countdown}`}
            className="h-[72vh] w-auto animate-[vvvSlideIn_0.2s_cubic-bezier(0.34,1.56,0.64,1)_forwards]"
            onLoad={() => setNumReady(true)}
          />
        </div>
      )}

      {/* ── 結果表示（仮） ── */}
      {phase === "RESULT" && (
        <div className="relative z-20 flex flex-col items-center gap-6 rounded-3xl bg-black/80 px-10 py-8 text-white shadow-[0_0_50px_rgba(255,60,60,0.5)]">
          <p className="text-xl font-bold tracking-[0.3em] text-red-300">VVV GACHA</p>
          <p className="text-4xl font-extrabold drop-shadow-[0_0_20px_rgba(255,100,100,0.9)]">
            {result.isWin ? "🎉 当たり" : "ハズレ"}
          </p>
          <RoundMetalButton label="CLOSE" subLabel="戻る" onClick={onClose} />
        </div>
      )}

      {/* ── ボタン ── */}
      {phase !== "RESULT" && (
        <div className="absolute bottom-10 left-0 right-0 z-20 flex items-center justify-center">
          <RoundMetalButton
            label={phase === "STANDBY" ? "VVV" : "NEXT"}
            subLabel={phase === "STANDBY" ? "START" : `▼ ${countdown}`}
            onClick={handleNext}
            disabled={!canPress}
          />
        </div>
      )}

      {/* ── プリロード ── */}
      <div aria-hidden className="hidden">
        {preloadNums.map((src) => <img key={src} src={src} alt="" />)}
        <video src={BG_LOOP}        preload="auto" />
        <video src={INSERT_A_VIDEO} preload="auto" />
        <video src={INSERT_B_VIDEO} preload="auto" />
        <video src={PUCHUN_VIDEO}   preload="auto" />
        <video src={LOSS_VIDEO}     preload="auto" />
      </div>

      <style>{`
        @keyframes vvvSlideIn {
          0%   { transform: translateX(100vw) scale(0.85); opacity: 0; }
          100% { transform: translateX(0)     scale(1);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
