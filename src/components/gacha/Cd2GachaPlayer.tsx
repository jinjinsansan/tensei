"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { StarOverlay } from "@/components/gacha/overlays/StarOverlay";
import { RoundMetalButton } from "@/components/gacha/controls/round-metal-button";
import { startCd2Gacha } from "@/lib/api/cd2-gacha";
import { useSignedAssetResolver } from "@/lib/gacha/client-assets";
import { buildCommonAssetPath } from "@/lib/gacha/assets";
import type { Cd2Step } from "@/lib/cd2-gacha/types";

// ─── VideoItem ────────────────────────────────────────────
type VideoItem = {
  key: string;
  src: string;
  loop?: boolean;
  step: Cd2Step;
  showOverlay?: boolean;
  isFreeze?: boolean;
};

// ─── PlayState ────────────────────────────────────────────
type PlayState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      isWin: boolean;
      isDonden: boolean;
      isPatlite: boolean;
      isFreeze: boolean;
      sequence: Cd2Step[];
      videoBasePath: string;
      expectationStars: number;
    };

// ─── キュー構築 ───────────────────────────────────────────
function buildQueue(sequence: Cd2Step[], basePath: string): VideoItem[] {
  const standbyBase = buildCommonAssetPath("standby");

  const items: VideoItem[] = [];
  sequence.forEach((step, i) => {
    const key = `${i}-${step}`;

    if (step === "standby") {
      items.push({
        key,
        src: `${standbyBase}/redstandby.mp4`,
        loop: true,
        step,
      });
      return;
    }

    if (step === "freeze") {
      items.push({ key, src: "", isFreeze: true, step });
      return;
    }

    if (step === "title_red") {
      items.push({ key, src: `${basePath}/title_red.mp4`, step, showOverlay: true });
      return;
    }

    // 汎用マップ (step名 → ファイル名)
    const FILE_MAP: Partial<Record<Cd2Step, string>> = {
      red_10: "red_10.mp4",
      red_9:  "red_9.mp4",
      red_8:  "red_8.mp4",
      red_7:  "red_7.mp4",
      red_6:  "red_6.mp4",
      red_5:  "red_5.mp4",
      red_4:  "red_4.mp4",
      red_3:  "red_3.mp4",
      red_2:  "red_2.mp4",
      red_1:  "red_1.mp4",
      red_0:  "red_0.mp4",
      red_3_win:  "red_3_win.mp4",
      red_2_win:  "red_2_win.mp4",
      red_1_win:  "red_1_win.mp4",
      red_0_win:  "red_0_win.mp4",
      red_3_loss: "red_3_loss.mp4",
      red_2_loss: "red_2_loss.mp4",
      red_0_loss: "red_0_loss.mp4",
      red_loss:   "red_loss.mp4",
      patlite:    "patlite.mp4",
      donden:     "donden.mp4",
      jackpot:    "jackpot.mp4",
    };

    const filename = FILE_MAP[step];
    if (filename) {
      items.push({ key, src: `${basePath}/${filename}`, step });
    }
  });

  return items;
}

// ─── フリーズオーバーレイ ─────────────────────────────────
function FreezeOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-black">
      {[0, 1].map((line) => (
        <div
          key={line}
          className="w-full overflow-hidden py-3"
          style={{ animationDelay: `${line * 0.5}s` }}
        >
          <p
            className="whitespace-nowrap text-lg text-white"
            style={{
              fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', 'MS PMincho', serif",
              animation: `cd2-scroll 4s linear infinite`,
              animationDelay: `${line * 2}s`,
              display: "inline-block",
            }}
          >
            ボタンは操作できません&emsp;&emsp;&emsp;ボタンは押すことができません&emsp;&emsp;&emsp;
            ボタンは操作できません&emsp;&emsp;&emsp;ボタンは押すことができません&emsp;&emsp;&emsp;
          </p>
        </div>
      ))}
      <style>{`
        @keyframes cd2-scroll {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-200%); }
        }
      `}</style>
    </div>
  );
}

// ─── 結果カード (プレースホルダー) ──────────────────────────
function ResultCard({ isWin, onClose }: { isWin: boolean; onClose?: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/90 px-6">
      <p className="text-[10px] uppercase tracking-[0.5em] text-white/50">
        COUNTDOWN CHALLENGE 2
      </p>

      {isWin ? (
        <div className="flex flex-col items-center gap-4">
          <p className="font-display text-5xl text-yellow-300 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]">
            当たり！
          </p>
          {/* プレースホルダーカード */}
          <div
            className="flex h-64 w-44 flex-col items-center justify-center rounded-2xl border-2 border-yellow-400/60 bg-gradient-to-br from-yellow-900/60 to-amber-950/80 shadow-[0_0_40px_rgba(250,204,21,0.4)]"
          >
            <p className="text-4xl">🏆</p>
            <p className="mt-3 text-center text-sm font-semibold text-yellow-200">当たりカード</p>
            <p className="mt-1 text-[10px] text-yellow-300/60">(PLACEHOLDER)</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <p className="font-display text-4xl text-zinc-400">ハズレ</p>
          {/* プレースホルダーカード */}
          <div
            className="flex h-64 w-44 flex-col items-center justify-center rounded-2xl border-2 border-zinc-600/60 bg-gradient-to-br from-zinc-900/60 to-zinc-950/80"
          >
            <p className="text-4xl">💀</p>
            <p className="mt-3 text-center text-sm font-semibold text-zinc-400">ハズレカード</p>
            <p className="mt-1 text-[10px] text-zinc-600">(PLACEHOLDER)</p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <RoundMetalButton label="もう一度" subLabel="RETRY" onClick={onClose} />
        <RoundMetalButton label="閉じる"   subLabel="CLOSE"  onClick={onClose} />
      </div>
    </div>
  );
}

// ─── Portal ───────────────────────────────────────────────
export function Cd2GachaPlayer({ open, onClose }: { open: boolean; onClose?: () => void }) {
  const portalTarget = typeof window === "undefined" ? null : document.body;

  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const nav = document.querySelector("nav") as HTMLElement | null;
    const prevNav = nav?.style.display;
    if (nav) nav.style.display = "none";
    return () => {
      document.body.style.overflow = prev;
      if (nav) nav.style.display = prevNav ?? "";
    };
  }, [open]);

  if (!open || !portalTarget) return null;
  return createPortal(<ActivePlayer onClose={onClose} />, portalTarget);
}

// ─── メインプレイヤー ─────────────────────────────────────
function ActivePlayer({ onClose }: { onClose?: () => void }) {
  const [playState, setPlayState] = useState<PlayState>({ status: "loading" });
  const [queue, setQueue]         = useState<VideoItem[]>([]);
  const [index, setIndex]         = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const videoRef        = useRef<HTMLVideoElement>(null);
  const lastReadyKeyRef = useRef<string | null>(null);
  const allowUnmuteRef  = useRef(false);

  // ── APIコール ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await startCd2Gacha();
        if (cancelled) return;
        const q = buildQueue(res.sequence, res.videoBasePath);
        setQueue(q);
        setPlayState({
          status: "ready",
          isWin: res.isWin,
          isDonden: res.isDonden,
          isPatlite: res.isPatlite,
          isFreeze: res.isFreeze,
          sequence: res.sequence,
          videoBasePath: res.videoBasePath,
          expectationStars: res.expectationStars,
        });
        setIndex(0);
        setVideoReady(false);
      } catch (err) {
        if (cancelled) return;
        setPlayState({
          status: "error",
          message: err instanceof Error ? err.message : "開始に失敗しました",
        });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── 署名済みURL解決 ───────────────────────────────────────
  const allSources = useMemo(() => queue.map((v) => v.src).filter(Boolean), [queue]);
  const { resolveAssetSrc } = useSignedAssetResolver(allSources);

  const current     = queue[index] ?? null;
  const resolvedSrc = useMemo(
    () => (current?.src ? resolveAssetSrc(current.src) : null),
    [current, resolveAssetSrc],
  );
  const videoKey = current ? `${index}-${current.key}` : "none";

  // ── 先読み (次3本) ────────────────────────────────────────
  const upcomingVideos = useMemo(() => {
    return queue
      .slice(index + 1, index + 4)
      .filter((item) => !item.loop && !item.isFreeze && item.src)
      .map((item) => resolveAssetSrc(item.src))
      .filter((src): src is string => Boolean(src));
  }, [index, queue, resolveAssetSrc]);

  // ── 再生 ──────────────────────────────────────────────────
  const syncPlayback = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const shouldUnmute = allowUnmuteRef.current;
    void v.play().then(() => {
      if (shouldUnmute && videoRef.current) videoRef.current.muted = false;
    }).catch(() => undefined);
  }, []);

  useEffect(() => { syncPlayback(); }, [syncPlayback, resolvedSrc, videoKey]);

  // ── 期待度オーバーレイ (タイトル映像中のみ) ──────────────────
  useEffect(() => {
    if (current?.showOverlay) {
      setShowOverlay(true);
      const t = setTimeout(() => setShowOverlay(false), 3000);
      return () => clearTimeout(t);
    }
    setShowOverlay(false);
    return undefined;
  }, [current?.showOverlay, videoKey]);

  // ── フリーズ: 10秒タイマーで自動終了 ─────────────────────────
  useEffect(() => {
    if (!current?.isFreeze) return undefined;
    const t = setTimeout(() => setShowResult(true), 10000);
    return () => clearTimeout(t);
  }, [current?.isFreeze, videoKey]);

  // ── videoイベント ─────────────────────────────────────────
  const handleReady = useCallback(() => {
    if (lastReadyKeyRef.current === videoKey) return;
    lastReadyKeyRef.current = videoKey;
    setVideoReady(true);
  }, [videoKey]);

  const handleEnded = useCallback(() => {
    lastReadyKeyRef.current = videoKey;
    setVideoReady(true);
  }, [videoKey]);

  const handleError = useCallback(() => { setVideoReady(true); }, []);

  // 1.5秒フォールバック
  useEffect(() => {
    if (videoReady || current?.isFreeze) return undefined;
    const t = setTimeout(() => setVideoReady(true), 1500);
    return () => clearTimeout(t);
  }, [videoReady, videoKey, current?.isFreeze]);

  // ── NEXT / SKIP ────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (!queue.length) return;
    allowUnmuteRef.current = true;
    const v = videoRef.current;
    if (v) { v.muted = false; void v.play().catch(() => undefined); }
    const next = index + 1;
    if (next >= queue.length) { setShowResult(true); return; }
    setVideoReady(false);
    setIndex(next);
  }, [index, queue.length]);

  const handleSkip = useCallback(() => { setShowResult(true); }, []);

  const isFreezeStep  = Boolean(current?.isFreeze);
  const nextDisabled  = !videoReady || playState.status !== "ready" || isFreezeStep;
  const skipDisabled  = isFreezeStep;
  const expStars      = playState.status === "ready" ? playState.expectationStars : 0;
  const isWin         = playState.status === "ready" ? playState.isWin : false;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black">
      <div className="relative flex h-full w-full max-w-[430px] flex-col">

        {/* ローディング */}
        {playState.status === "loading" && (
          <div className="h-full bg-black" />
        )}

        {/* エラー */}
        {playState.status === "error" && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-white">
            <p className="text-lg font-semibold">チャレンジを開始できませんでした</p>
            <p className="text-sm text-white/70">{playState.message}</p>
            <RoundMetalButton label="閉じる" subLabel="CLOSE" onClick={onClose} />
          </div>
        )}

        {/* 映像プレイヤー */}
        {playState.status === "ready" && current && !showResult && (
          <>
            {/* フリーズオーバーレイ */}
            {isFreezeStep ? (
              <div className="h-full w-full">
                <FreezeOverlay />
              </div>
            ) : (
              <div className="relative h-full w-full overflow-hidden rounded-[30px] bg-black shadow-[0_30px_100px_rgba(0,0,0,0.75)]">
                <video
                  ref={videoRef}
                  key={videoKey}
                  src={resolvedSrc ?? undefined}
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  preload="auto"
                  loop={Boolean(current.loop)}
                  playsInline
                  onCanPlayThrough={handleReady}
                  onLoadedData={handleReady}
                  onEnded={handleEnded}
                  onError={handleError}
                />
                {/* 期待度オーバーレイ */}
                {showOverlay && expStars > 0 && (
                  <StarOverlay starCount={expStars} />
                )}
              </div>
            )}

            {/* NEXT / SKIP ボタン */}
            {!isFreezeStep && (
              <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-4">
                <RoundMetalButton
                  label="NEXT"
                  subLabel="進む"
                  onClick={goNext}
                  disabled={nextDisabled}
                />
                <RoundMetalButton
                  label="SKIP"
                  subLabel="スキップ"
                  onClick={handleSkip}
                  disabled={skipDisabled}
                />
              </div>
            )}
          </>
        )}

        {/* 結果表示 */}
        {showResult && playState.status === "ready" && (
          <ResultCard isWin={isWin} onClose={onClose} />
        )}
      </div>

      {/* 先読み (iPhone タイムラグ対策) */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: -2,
          left: -2,
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {upcomingVideos.map((src) => (
          <video key={src} src={src} preload="auto" playsInline muted />
        ))}
      </div>
    </div>
  );
}
