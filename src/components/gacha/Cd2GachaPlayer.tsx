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
  autoAdvance?: boolean; // true = 映像終了後に自動で次へ進む（NEXTボタン非表示）
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
      // ① 来世ガチャ・バトルガチャと共通のスタンバイ映像をランダム選択
      const STANDBY_FILES = [
        "blackstandby.mp4",
        "bluestandby.mp4",
        "rainbowstandby.mp4",
        "redstandby.mp4",
        "whitestandby.mp4",
        "yellowstandby.mp4",
      ];
      const picked = STANDBY_FILES[Math.floor(Math.random() * STANDBY_FILES.length)];
      items.push({
        key,
        src: `${standbyBase}/${picked}`,
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
      // タイトルは自動再生（NEXTボタンなし）
      items.push({ key, src: `${basePath}/title_red.mp4`, step, showOverlay: true, autoAdvance: true });
      return;
    }

    // 汎用マップ (step名 → ファイル名 + autoAdvance)
    type FileEntry = { file: string; auto?: boolean };
    const FILE_MAP: Partial<Record<Cd2Step, FileEntry>> = {
      red_10:     { file: "red_10.mp4" },
      red_9:      { file: "red_9.mp4" },
      red_8:      { file: "red_8.mp4" },
      red_7:      { file: "red_7.mp4" },
      red_6:      { file: "red_6.mp4" },
      red_5:      { file: "red_5.mp4" },
      red_4:      { file: "red_4.mp4" },
      red_3:      { file: "red_3.mp4" },
      red_2:      { file: "red_2.mp4" },
      red_1:      { file: "red_1.mp4" },
      red_0:      { file: "red_0.mp4" },
      red_3_win:  { file: "red_3_win.mp4" },
      red_2_win:  { file: "red_2_win.mp4" },
      red_1_win:  { file: "red_1_win.mp4" },
      red_0_win:  { file: "red_0_win.mp4" },
      red_3_loss: { file: "red_3_loss.mp4" },
      red_2_loss: { file: "red_2_loss.mp4" },
      red_1_loss: { file: "red_loss.mp4" },   // 素材なし → 汎用ハズレで代用
      red_0_loss: { file: "red_0_loss.mp4" },
      red_loss:   { file: "red_loss.mp4" },
      patlite:    { file: "patlite.mp4",  auto: true }, // 自動再生
      donden:     { file: "donden.mp4",   auto: true }, // 自動再生
      jackpot:    { file: "jackpot.mp4",  auto: true }, // 自動再生
    };

    const entry = FILE_MAP[step];
    if (entry) {
      items.push({
        key,
        src: `${basePath}/${entry.file}`,
        step,
        autoAdvance: entry.auto ?? false,
      });
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

  // ── videoを即時クリア (iOSのGPUレイヤーゴースト防止) ──────────
  const clearVideoSrc = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.src = "";       // src を空にすることでiOSのGPUキャッシュを即時破棄
    v.load();         // バッファをクリア
  }, []);

  // ── videoイベント ─────────────────────────────────────────
  const handleReady = useCallback(() => {
    if (lastReadyKeyRef.current === videoKey) return;
    lastReadyKeyRef.current = videoKey;
    setVideoReady(true);
  }, [videoKey]);

  const handleEnded = useCallback(() => {
    lastReadyKeyRef.current = videoKey;
    if (current?.autoAdvance) {
      clearVideoSrc();  // ← 自動進行時も同様にGPUクリア
      allowUnmuteRef.current = true;
      const next = index + 1;
      if (next >= queue.length) { setShowResult(true); return; }
      setVideoReady(false);
      setIndex(next);
    } else {
      setVideoReady(true);
    }
  }, [videoKey, current?.autoAdvance, index, queue.length, clearVideoSrc]);

  const handleError = useCallback(() => { setVideoReady(true); }, []);

  // 1.5秒フォールバック (autoAdvance ステップは除外)
  useEffect(() => {
    if (videoReady || current?.isFreeze || current?.autoAdvance) return undefined;
    const t = setTimeout(() => setVideoReady(true), 1500);
    return () => clearTimeout(t);
  }, [videoReady, videoKey, current?.isFreeze, current?.autoAdvance]);

  // ── NEXT / SKIP ────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (!queue.length) return;
    clearVideoSrc();  // ← Reactの状態更新より先にDOMを直接クリア
    allowUnmuteRef.current = true;
    const next = index + 1;
    if (next >= queue.length) { setShowResult(true); return; }
    setVideoReady(false);
    setIndex(next);
  }, [index, queue.length, clearVideoSrc]);

  const handleSkip = useCallback(() => { setShowResult(true); }, []);

  const isFreezeStep   = Boolean(current?.isFreeze);
  const isAutoStep     = Boolean(current?.autoAdvance);
  const nextDisabled   = !videoReady || playState.status !== "ready" || isFreezeStep;
  const skipDisabled   = isFreezeStep;
  const showButtons    = !isFreezeStep && !isAutoStep;
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
              <div
                className="relative h-full w-full overflow-hidden"
                style={{
                  background: "#000",
                  // コンテナ全体をGPUコンポジットレイヤーに乗せる
                  // → iOS SafariでStarOverlay+videoの合成問題を防ぐ
                  WebkitTransform: "translate3d(0,0,0)",
                  transform: "translate3d(0,0,0)",
                  // 動画ファイルやレンダリングの白枠を黒で上書きするinset shadow
                  boxShadow: "inset 0 0 0 2px #000",
                }}
              >
                <video
                  ref={videoRef}
                  key={videoKey}
                  src={resolvedSrc ?? undefined}
                  className="block h-full w-full object-cover"
                  autoPlay
                  muted
                  preload="auto"
                  loop={Boolean(current.loop)}
                  playsInline
                  onCanPlayThrough={handleReady}
                  onLoadedData={handleReady}
                  onEnded={handleEnded}
                  onError={handleError}
                  style={{ background: "#000" }}
                />
                {/* 映像切替時の前フレーム残像対策: 読込中は黒オーバーレイ */}
                <div
                  className="pointer-events-none absolute inset-0 bg-black"
                  style={{ opacity: videoReady ? 0 : 1 }}
                />
                {/* 期待度オーバーレイ */}
                {showOverlay && expStars > 0 && (
                  <StarOverlay starCount={expStars} />
                )}
              </div>
            )}

            {/* NEXT / SKIP ボタン (自動再生ステップ・フリーズ中は非表示) */}
            {showButtons && (
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
