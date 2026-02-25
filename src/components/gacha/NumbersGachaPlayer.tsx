"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { CardReveal } from "@/components/gacha/CardReveal";
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
    };

function stageFromStep(step?: NumbersStep): NumbersStage {
  if (!step) return "first";
  if (step.startsWith("cd_red")) return "first";
  if (step.startsWith("cd_green")) return "second";
  if (step.startsWith("cd_blue")) return "third";
  if (step.startsWith("cd_rainbow")) return "final";
  return "first";
}

function buildQueue(sequence: NumbersStep[], basePath: string): VideoItem[] {
  const items: VideoItem[] = [
    { key: "standby", src: `${basePath}/standby.mp4`, loop: true, stageHint: "first" },
    { key: "title", src: `${basePath}/title_start.mp4`, stageHint: "first" },
  ];

  sequence.forEach((step) => {
    if (step.startsWith("cd_")) {
      items.push({ key: step, src: `${basePath}/${step}.mp4`, step, stageHint: stageFromStep(step) });
    } else if (step === "promotion") {
      items.push({ key: step, src: `${basePath}/promotion.mp4`, step });
    } else if (step === "demotion") {
      items.push({ key: step, src: `${basePath}/demotion.mp4`, step });
    } else if (step === "revival") {
      items.push({ key: step, src: `${basePath}/revival.mp4`, step });
    } else if (step === "loser") {
      items.push({ key: step, src: `${basePath}/loser.mp4`, step });
    } else if (step === "puchun") {
      items.push({ key: step, src: buildCommonAssetPath('puchun/puchun.mp4'), step });
    }
  });

  return items;
}

function formatResultLabel(resultType: string) {
  if (resultType === "miss") return "敗北";
  if (resultType.startsWith("star")) {
    const n = Number(resultType.replace("star", ""));
    if (Number.isFinite(n)) return `★${n}`;
  }
  return "RESULT";
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
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const nav = document.querySelector("nav") as HTMLElement | null;
    const prevNavDisplay = nav?.style.display;
    if (nav) nav.style.display = "none";
    return () => {
      document.body.style.overflow = prevOverflow;
      if (nav) nav.style.display = prevNavDisplay ?? "";
    };
  }, [open]);

  if (!open || !portalTarget) return null;
  return createPortal(<ActiveNumbersPlayer onClose={onClose} />, portalTarget);
}

function ActiveNumbersPlayer({ onClose }: { onClose?: () => void }) {
  const [playState, setPlayState] = useState<PlayState>({ status: "loading" });
  const [queue, setQueue] = useState<VideoItem[]>([]);
  const [index, setIndex] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultError, setResultError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const lastReadyKeyRef = useRef<string | null>(null);
  const allowUnmuteRef = useRef(false);

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
        });
        setIndex(0);
        setVideoReady(false);
      } catch (error) {
        if (cancelled) return;
        setPlayState({ status: "error", message: error instanceof Error ? error.message : "開始に失敗しました" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const allSources = useMemo(() => queue.map((v) => v.src), [queue]);
  const { resolveAssetSrc } = useSignedAssetResolver(allSources);

  const current = queue[index] ?? null;
  const resolvedSrc = useMemo(() => resolveAssetSrc(current?.src ?? null), [current, resolveAssetSrc]);
  const videoKey = current ? `${index}-${current.key}` : "none";

  const syncPlayback = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const shouldUnmute = allowUnmuteRef.current;
    void v.play().then(() => {
      if (shouldUnmute && videoRef.current) {
        videoRef.current.muted = false;
      }
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    syncPlayback();
  }, [syncPlayback, resolvedSrc, videoKey]);

  const handleReady = useCallback(() => {
    if (lastReadyKeyRef.current === videoKey) return;
    lastReadyKeyRef.current = videoKey;
    setVideoReady(true);
  }, [videoKey]);

  const handleEnded = useCallback(() => {
    if (lastReadyKeyRef.current !== videoKey) {
      lastReadyKeyRef.current = videoKey;
    }
    setVideoReady(true);
  }, [videoKey]);

  const handleError = useCallback(() => {
    // Fallback: allow progression even if video failed to load
    setVideoReady(true);
  }, []);

  useEffect(() => {
    if (videoReady) return undefined;
    const timer = setTimeout(() => setVideoReady(true), 1500);
    return () => clearTimeout(timer);
  }, [videoReady, videoKey]);

  const goNext = useCallback(() => {
    if (!queue.length) return;
    allowUnmuteRef.current = true;
    const v = videoRef.current;
    if (v) {
      v.muted = false;
      void v.play().catch(() => undefined);
    }
    const next = index + 1;
    if (next >= queue.length) {
      setShowResult(true);
      return;
    }
    setVideoReady(false);
    setIndex(next);
  }, [index, queue.length]);

  const handleSkip = useCallback(() => {
    setShowResult(true);
  }, []);

  const stage = useMemo<NumbersStage>(() => {
    if (current?.stageHint) return current.stageHint;
    if (playState.status === "ready") return playState.finalStage;
    return "first";
  }, [current?.stageHint, playState]);

  const badge = useMemo(() => {
    const labels: Record<NumbersStage, { label: string; color: string }> = {
      first: { label: "FIRST STAGE", color: "#ff5a5a" },
      second: { label: "SECOND STAGE", color: "#4ade80" },
      third: { label: "THIRD STAGE", color: "#60a5fa" },
      final: { label: "FINAL STAGE", color: "#f472b6" },
    };
    return labels[stage];
  }, [stage]);

  const cardStar = useMemo(() => (playState.status === "ready" ? starFromResult(playState.resultType) : 0), [playState]);
  const isLoss = playState.status === "ready" && playState.resultType === "miss";

  const nextDisabled = !videoReady || playState.status !== "ready";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black">
      <div className="relative flex h-full w-full max-w-[430px] flex-col">
        {badge && (
          <div className="absolute right-4 top-4 z-20 rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.28em] text-white shadow-[0_10px_30px_rgba(0,0,0,0.4)]" style={{ background: `${badge.color}33`, border: `1px solid ${badge.color}66` }}>
            {badge.label}
          </div>
        )}

        {playState.status === "loading" && (
          <div className="flex h-full items-center justify-center text-sm text-white/70">読み込み中...</div>
        )}

        {playState.status === "error" && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-white">
            <p className="text-lg font-semibold">ナンバーズガチャを開始できませんでした</p>
            <p className="text-sm text-white/70">{playState.message}</p>
            <RoundMetalButton label="閉じる" subLabel="CLOSE" onClick={onClose} />
          </div>
        )}

        {playState.status === "ready" && current && !showResult && (
          <>
            <div className="relative h-full w-full overflow-hidden rounded-[30px] border border-white/10 bg-black shadow-[0_30px_100px_rgba(0,0,0,0.75)]">
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
            </div>

            <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-4">
              <RoundMetalButton label="NEXT" subLabel="進む" onClick={goNext} disabled={nextDisabled} />
              <RoundMetalButton label="SKIP" subLabel="スキップ" onClick={handleSkip} />
            </div>
          </>
        )}

        {showResult && playState.status === "ready" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 px-4">
            <div className="mb-6 text-center text-white">
              <p className="text-xs uppercase tracking-[0.35em] text-amber-300">NUMBERS GACHA</p>
              <p className="mt-2 text-4xl font-extrabold">{formatResultLabel(playState.resultType)}</p>
            </div>
            <CardReveal
              starRating={cardStar}
              cards={[
                {
                  id: isLoss ? "loss" : `numbers_star_${cardStar}`,
                  cardName: isLoss ? "ハズレカード" : `★${cardStar} カード（プレースホルダー）`,
                  imageUrl: "",
                  starRating: cardStar,
                },
              ]}
              loading={false}
              onClose={onClose ?? (() => undefined)}
              resultLabel={formatResultLabel(playState.resultType)}
              errorMessage={resultError}
              primaryCtaLabel="もう一度"
              onRetry={() => {
                setResultError(null);
                onClose?.();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
