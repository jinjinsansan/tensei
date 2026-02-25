"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { CardReveal } from "@/components/gacha/CardReveal";
import { StarOverlay } from "@/components/gacha/overlays/StarOverlay";
import { RoundMetalButton } from "@/components/gacha/controls/round-metal-button";
import { startNumbersGacha } from "@/lib/api/numbers-gacha";
import type { NumbersStage, NumbersStep } from "@/lib/numbers-gacha/types";
import { useSignedAssetResolver } from "@/lib/gacha/client-assets";
import { buildCommonAssetPath } from "@/lib/gacha/assets";

type VideoItem = {
  key: string;
  src: string;
  loop?: boolean;
  step?: NumbersStep;
  stageHint?: NumbersStage;
  showOverlay?: boolean;
};

type PlayState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      sequence: NumbersStep[];
      resultType: string;
      finalStage: NumbersStage;
      basePath: string;
      expectationStars: number;
    };

function stageFromStep(step?: NumbersStep): NumbersStage {
  if (!step) return "first";
  if (step.startsWith("cd_red"))     return "first";
  if (step.startsWith("cd_green"))   return "second";
  if (step.startsWith("cd_blue"))    return "third";
  if (step.startsWith("cd_rainbow")) return "final";
  return "first";
}

function buildQueue(sequence: NumbersStep[], basePath: string): VideoItem[] {
  const standbyBase = buildCommonAssetPath("standby");
  const puchunSrc   = buildCommonAssetPath("puchun/puchun.mp4");

  const STANDBY_MAP: Record<string, string> = {
    standby_black:   `${standbyBase}/blackstandby.mp4`,
    standby_blue:    `${standbyBase}/bluestandby.mp4`,
    standby_rainbow: `${standbyBase}/rainbowstandby.mp4`,
    standby_red:     `${standbyBase}/redstandby.mp4`,
    standby_white:   `${standbyBase}/whitestandby.mp4`,
    standby_yellow:  `${standbyBase}/yellowstandby.mp4`,
  };

  const items: VideoItem[] = [];

  sequence.forEach((step, i) => {
    const key = `${i}-${step}`;
    if (step in STANDBY_MAP) {
      items.push({ key, src: STANDBY_MAP[step], loop: true, step, stageHint: "first" });
    } else if (step === "title") {
      items.push({ key, src: `${basePath}/title_start.mp4`, step, stageHint: "first", showOverlay: true });
    } else if (step === "puchun") {
      items.push({ key, src: puchunSrc, step });
    } else if (step === "win_confirm") {
      items.push({ key, src: `${basePath}/win_confirm.mp4`, step });
    } else if (step === "promotion_a") {
      items.push({ key, src: `${basePath}/promotion_a.mp4`, step });
    } else if (step === "patlite") {
      items.push({ key, src: `${basePath}/patlite.mp4`, step });
    } else if (step === "challenge_fail") {
      items.push({ key, src: `${basePath}/challenge_fail.mp4`, step });
    } else if (step === "demotion_full") {
      items.push({ key, src: `${basePath}/demotion_full.mp4`, step });
    } else if (step === "revival_1") {
      items.push({ key, src: `${basePath}/revival_1.mp4`, step });
    } else if (step === "revival_3") {
      items.push({ key, src: `${basePath}/revival_3.mp4`, step });
    } else if (step === "loser") {
      // loser は映像なし — キューに追加しない (queue末尾になることで結果表示)
    } else if (step.startsWith("cd_")) {
      items.push({ key, src: `${basePath}/${step}.mp4`, step, stageHint: stageFromStep(step) });
    }
  });

  return items;
}

function formatResultLabel(resultType: string) {
  if (resultType === "miss") return "チャレンジ失敗";
  const n = Number(resultType.replace("star", ""));
  return Number.isFinite(n) ? `★${n}` : "RESULT";
}

function starFromResult(resultType: string): number {
  if (resultType === "miss") return 0;
  const n = Number(resultType.replace("star", ""));
  return Number.isFinite(n) ? Math.max(1, Math.min(12, n)) : 1;
}

export function NumbersGachaPlayer({ open, onClose }: { open: boolean; onClose?: () => void }) {
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

  // ── APIコール ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await startNumbersGacha();
        if (cancelled) return;
        const q = buildQueue(res.sequence, res.videoBasePath);
        setQueue(q);
        setPlayState({
          status: "ready",
          sequence: res.sequence,
          resultType: res.resultType,
          finalStage: res.finalStage,
          basePath: res.videoBasePath,
          expectationStars: res.expectationStars,
        });
        setIndex(0);
        setVideoReady(false);
      } catch (err) {
        if (cancelled) return;
        setPlayState({ status: "error", message: err instanceof Error ? err.message : "開始に失敗しました" });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── サイン付きURL解決 ─────────────────────────────
  const allSources = useMemo(() => queue.map((v) => v.src), [queue]);
  const { resolveAssetSrc } = useSignedAssetResolver(allSources);

  const current     = queue[index] ?? null;
  const resolvedSrc = useMemo(() => resolveAssetSrc(current?.src ?? null), [current, resolveAssetSrc]);
  const videoKey    = current ? `${index}-${current.key}` : "none";

  // ── 再生 ─────────────────────────────────────────
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

  // ── オーバーレイ: title映像中のみ表示して3秒で消す ──
  useEffect(() => {
    if (current?.showOverlay) {
      setShowOverlay(true);
      const t = setTimeout(() => setShowOverlay(false), 3000);
      return () => clearTimeout(t);
    }
    setShowOverlay(false);
    return undefined;
  }, [current?.showOverlay, videoKey]);

  // ── videoReadyイベント ────────────────────────────
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
    if (videoReady) return undefined;
    const t = setTimeout(() => setVideoReady(true), 1500);
    return () => clearTimeout(t);
  }, [videoReady, videoKey]);

  // ── NEXT / SKIP ───────────────────────────────────
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

  // ── ステージバッジ ─────────────────────────────────
  const lastStageRef = useRef<NumbersStage>("first");
  if (current?.stageHint) lastStageRef.current = current.stageHint;
  const stage = lastStageRef.current;

  const badge = useMemo(() => {
    const map: Record<NumbersStage, { label: string; color: string }> = {
      first:  { label: "FIRST STAGE",  color: "#ff5a5a" },
      second: { label: "SECOND STAGE", color: "#4ade80" },
      third:  { label: "THIRD STAGE",  color: "#60a5fa" },
      final:  { label: "FINAL STAGE",  color: "#f472b6" },
    };
    return map[stage];
  }, [stage]);

  const cardStar = useMemo(() =>
    playState.status === "ready" ? starFromResult(playState.resultType) : 0, [playState]);
  const isLoss   = playState.status === "ready" && playState.resultType === "miss";
  const nextDisabled = !videoReady || playState.status !== "ready";

  const expStars = playState.status === "ready" ? playState.expectationStars : 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black">
      <div className="relative flex h-full w-full max-w-[430px] flex-col">

        {/* ステージバッジ */}
        {badge && playState.status === "ready" && !showResult && (
          <div
            className="absolute right-4 top-4 z-20 rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.28em] text-white shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
            style={{ background: `${badge.color}33`, border: `1px solid ${badge.color}66` }}
          >
            {badge.label}
          </div>
        )}

        {/* ローディング */}
        {playState.status === "loading" && (
          <div className="flex h-full items-center justify-center text-sm text-white/70">
            読み込み中...
          </div>
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
              {/* 期待度オーバーレイ (title映像中のみ) */}
              {showOverlay && expStars > 0 && (
                <StarOverlay starCount={expStars} />
              )}
            </div>

            <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-4">
              <RoundMetalButton label="NEXT" subLabel="進む"    onClick={goNext}     disabled={nextDisabled} />
              <RoundMetalButton label="SKIP" subLabel="スキップ" onClick={handleSkip} />
            </div>
          </>
        )}

        {/* 結果 */}
        {showResult && playState.status === "ready" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 px-4">
            <div className="mb-6 text-center text-white">
              <p className="text-xs uppercase tracking-[0.35em] text-amber-300">COUNTDOWN CHALLENGE</p>
              <p className="mt-2 text-4xl font-extrabold">{formatResultLabel(playState.resultType)}</p>
            </div>
            <CardReveal
              starRating={cardStar}
              cards={[{
                id: isLoss ? "loss" : `numbers_star_${cardStar}`,
                cardName: isLoss ? "チャレンジ失敗" : `★${cardStar} カード`,
                imageUrl: "",
                starRating: cardStar,
              }]}
              loading={false}
              onClose={onClose ?? (() => undefined)}
              resultLabel={formatResultLabel(playState.resultType)}
              primaryCtaLabel="もう一度"
              onRetry={() => { onClose?.(); }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
