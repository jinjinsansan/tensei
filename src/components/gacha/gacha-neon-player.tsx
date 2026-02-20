"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

import { cn } from "@/lib/utils/cn";

import { GachaPlayer } from "@/components/gacha/GachaPlayer";
import { RoundMetalButton } from "@/components/gacha/controls/round-metal-button";
import { CardReveal } from "@/components/gacha/CardReveal";
import { playGacha, claimGachaResult } from "@/lib/api/gacha";
import type { PlayResponse } from "@/lib/api/gacha";
import type { GachaResult, GachaPhase } from "@/lib/gacha/common/types";

type PlayVariant = "round" | "default" | "button";

type PlayerPull = {
  order: number;
  resultId: string | null;
  gachaResult: GachaResult;
};

type ClaimState = {
  loading: boolean;
  serialNumber: number | null;
  error: string | null;
};

type Props = {
  playLabel?: string;
  playVariant?: PlayVariant;
  className?: string;
  containerClassName?: string;
  buttonWrapperClassName?: string;
};

export function GachaNeonPlayer({
  playLabel = "10連ガチャ\nスタート",
  playVariant = "round",
  className,
  containerClassName,
  buttonWrapperClassName,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [activePulls, setActivePulls] = useState<PlayerPull[] | null>(null);
  const [sessionMeta, setSessionMeta] = useState<{ multiSessionId: string | null; totalPulls: number } | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [skipAllRequested, setSkipAllRequested] = useState(false);
  const [claims, setClaims] = useState<Record<string, ClaimState>>({});
  const [error, setError] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<GachaPhase | null>(null);

  const totalPulls = sessionMeta?.totalPulls ?? activePulls?.length ?? 0;
  const currentPull = activePulls && currentIndex < totalPulls ? activePulls[currentIndex] : null;
  const showPlayer = Boolean(currentPull) && !summaryOpen && !skipAllRequested;
  const activeResult = showPlayer ? currentPull?.gachaResult ?? null : null;
  const normalizedLabel = typeof playLabel === "string" ? playLabel.replace(/\\n/g, "\n") : playLabel;
  const isDisabled = isLoading || Boolean(activePulls);

  const startPlay = useCallback(async () => {
    if (isDisabled) return;
    setError(null);
    setIsLoading(true);
    
    // ローディング開始を即座に反映するため、少し待つ
    await new Promise((resolve) => setTimeout(resolve, 50));
    
    try {
      const response = await playGacha();
      const pulls = mapResponseToPulls(response);
      setActivePulls(pulls);
      setSessionMeta(response.session);
      setCurrentIndex(0);
      setSummaryOpen(false);
      setSkipAllRequested(false);
      setClaims({});
      // sessionStorageに保存
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(
          "gacha_session",
          JSON.stringify({
            pulls,
            session: response.session,
            currentIndex: 0,
            claims: {},
            summaryOpen: false,
          }),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "ガチャを開始できませんでした。");
    } finally {
      setIsLoading(false);
    }
  }, [isDisabled]);

  const ensureClaimForResult = useCallback((resultId: string) => {
    if (!resultId) return;
    setClaims((prev) => {
      const existing = prev[resultId];
      if (existing?.loading || existing?.serialNumber != null) {
        return prev;
      }
      return {
        ...prev,
        [resultId]: {
          serialNumber: existing?.serialNumber ?? null,
          loading: true,
          error: null,
        },
      };
    });

    void claimGachaResult(resultId)
      .then((res) => {
        setClaims((prev) => ({
          ...prev,
          [resultId]: {
            serialNumber: res.serialNumber ?? null,
            loading: false,
            error: null,
          },
        }));
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "カードの確定に失敗しました。";
        setClaims((prev) => ({
          ...prev,
          [resultId]: {
            serialNumber: prev[resultId]?.serialNumber ?? null,
            loading: false,
            error: message,
          },
        }));
      });
  }, []);

  const handleResultResolved = useCallback(({ resultId, serialNumber }: { resultId: string | null; serialNumber: number | null }) => {
    if (!resultId) return;
    setClaims((prev) => ({
      ...prev,
      [resultId]: {
        serialNumber,
        loading: false,
        error: null,
      },
    }));
  }, []);

  const handlePlayerClose = useCallback(() => {
    if (!activePulls) return;
    const isLast = currentIndex >= activePulls.length - 1;
    if (skipAllRequested || isLast) {
      setSummaryOpen(true);
    } else {
      const nextIndex = Math.min(currentIndex + 1, activePulls.length - 1);
      setCurrentIndex(nextIndex);
      // sessionStorageを更新
      if (typeof sessionStorage !== "undefined") {
        const stored = sessionStorage.getItem("gacha_session");
        if (stored) {
          try {
            const data = JSON.parse(stored);
            data.currentIndex = nextIndex;
            sessionStorage.setItem("gacha_session", JSON.stringify(data));
          } catch {
            // ignore
          }
        }
      }
    }
  }, [activePulls, currentIndex, skipAllRequested]);

  const handleSkipAll = useCallback(async () => {
    if (!activePulls) return;
    // すぐにskipフラグを立ててUIを隠す
    setSkipAllRequested(true);
    setCurrentPhase(null);
    
    // 全カードのclaimを並列実行して完了を待つ
    const claimPromises = activePulls
      .filter((pull) => pull.resultId && !claims[pull.resultId])
      .map((pull) => {
        if (!pull.resultId) return Promise.resolve();
        return claimGachaResult(pull.resultId)
          .then((res) => {
            setClaims((prev) => ({
              ...prev,
              [pull.resultId!]: {
                serialNumber: res.serialNumber ?? null,
                loading: false,
                error: null,
              },
            }));
          })
          .catch((err) => {
            const message = err instanceof Error ? err.message : "カードの確定に失敗しました。";
            setClaims((prev) => ({
              ...prev,
              [pull.resultId!]: {
                serialNumber: prev[pull.resultId!]?.serialNumber ?? null,
                loading: false,
                error: message,
              },
            }));
          });
      });
    // 全てのclaim完了を待つ
    await Promise.allSettled(claimPromises);
    setSummaryOpen(true);
  }, [activePulls, claims]);

  const resetSession = useCallback(() => {
    setActivePulls(null);
    setSessionMeta(null);
    setCurrentIndex(0);
    setSummaryOpen(false);
    setSkipAllRequested(false);
    setClaims({});
    setCurrentPhase(null);
    // sessionStorageをクリア
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem("gacha_session");
    }
  }, []);

  // マウント時にsessionStorageから復元
  useEffect(() => {
    if (typeof sessionStorage === "undefined") return;
    const stored = sessionStorage.getItem("gacha_session");
    if (!stored) return;
    try {
      const data = JSON.parse(stored);
      if (data.pulls && Array.isArray(data.pulls) && data.pulls.length > 0) {
        setActivePulls(data.pulls);
        setSessionMeta(data.session ?? null);
        setCurrentIndex(data.currentIndex ?? 0);
        setClaims(data.claims ?? {});
        // サマリー表示中だった場合はサマリーを開く
        if (data.summaryOpen) {
          setSummaryOpen(true);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // claims状態の変更をsessionStorageに同期
  useEffect(() => {
    if (typeof sessionStorage === "undefined" || !activePulls) return;
    const stored = sessionStorage.getItem("gacha_session");
    if (!stored) return;
    try {
      const data = JSON.parse(stored);
      data.claims = claims;
      sessionStorage.setItem("gacha_session", JSON.stringify(data));
    } catch {
      // ignore
    }
  }, [claims, activePulls]);

  // summaryOpen状態の変更をsessionStorageに同期
  useEffect(() => {
    if (typeof sessionStorage === "undefined" || !activePulls) return;
    const stored = sessionStorage.getItem("gacha_session");
    if (!stored) return;
    try {
      const data = JSON.parse(stored);
      data.summaryOpen = summaryOpen;
      sessionStorage.setItem("gacha_session", JSON.stringify(data));
    } catch {
      // ignore
    }
  }, [summaryOpen, activePulls]);

  useEffect(() => {
    if (!summaryOpen || !activePulls) return;
    activePulls.forEach((pull) => {
      if (!pull.resultId) return;
      if (!claims[pull.resultId]) {
        ensureClaimForResult(pull.resultId);
      }
    });
  }, [summaryOpen, activePulls, claims, ensureClaimForResult]);

  const summaryCards = useMemo(() => {
    if (!activePulls) return [];
    return activePulls.map((pull, index) => ({
      id: pull.resultId ?? `${pull.gachaResult.cardId}-${index}`,
      cardName: pull.gachaResult.cardName,
      imageUrl: pull.gachaResult.cardImagePath,
      starRating: pull.gachaResult.starRating,
      serialNumber: pull.resultId ? claims[pull.resultId]?.serialNumber ?? null : null,
      description: pull.gachaResult.cardTitle,
    }));
  }, [activePulls, claims]);

  const summaryStarRating = useMemo(() => {
    if (!activePulls || !activePulls.length) return 0;
    return activePulls.reduce((max, pull) => Math.max(max, pull.gachaResult.starRating), 0);
  }, [activePulls]);

  const summaryLoading = useMemo(() => {
    if (!activePulls) return false;
    return activePulls.some((pull) => pull.resultId && claims[pull.resultId]?.loading);
  }, [activePulls, claims]);

  const erroredResultId = useMemo(() => {
    if (!activePulls) return null;
    for (const pull of activePulls) {
      if (!pull.resultId) continue;
      if (claims[pull.resultId]?.error) {
        return pull.resultId;
      }
    }
    return null;
  }, [activePulls, claims]);

  const button = useMemo(() => {
    if (playVariant === "round") {
      return (
        <RoundMetalButton label={normalizedLabel} subLabel="START" onClick={startPlay} disabled={isDisabled} />
      );
    }
    if (playVariant === "button") {
      return (
        <button type="button" onClick={startPlay} disabled={isDisabled} className={className}>
          {isLoading ? "準備中..." : normalizedLabel}
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={startPlay}
        disabled={isDisabled}
        className="w-full max-w-md rounded-[14px] border border-white/20 bg-gradient-to-b from-white/85 to-white/50 px-8 py-4 text-base font-bold tracking-[0.08em] text-[#1a2230] shadow-[0_14px_30px_rgba(0,0,0,0.28),inset_0_2px_0_rgba(255,255,255,0.85),inset_0_-3px_0_rgba(0,0,0,0.2)] transition-all duration-150 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "準備中..." : normalizedLabel}
      </button>
    );
  }, [normalizedLabel, playVariant, startPlay, isDisabled, isLoading, className]);

  const ctaLabel = currentIndex >= totalPulls - 1 ? "結果一覧へ" : "次の転生へ";
  const showProgressOverlay = showPlayer && activePulls && currentPhase !== "CARD_REVEAL";

  return (
    <div className={cn("space-y-3 text-center", containerClassName)}>
      <div className={cn("flex justify-center", buttonWrapperClassName)}>{button}</div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {isLoading && !activePulls ? <LoadingOverlay /> : null}
      {showPlayer && currentPull ? (
        <GachaPlayer
          gachaResult={activeResult}
          onClose={handlePlayerClose}
          sessionId={currentPull.resultId ?? undefined}
          resultId={currentPull.resultId ?? undefined}
          onResultResolved={handleResultResolved}
          cardRevealCtaLabel={ctaLabel}
          onCurrentPhaseChange={setCurrentPhase}
        />
      ) : null}
      {showProgressOverlay ? (
        <BatchProgressOverlay currentIndex={currentIndex} totalPulls={totalPulls} onSkipAll={handleSkipAll} />
      ) : null}
      {summaryOpen && activePulls ? (
        <BatchSummaryOverlay
          cards={summaryCards}
          starRating={summaryStarRating}
          loading={summaryLoading}
          errorMessage={erroredResultId ? claims[erroredResultId]?.error ?? null : null}
          onRetry={erroredResultId ? () => ensureClaimForResult(erroredResultId) : undefined}
          onClose={resetSession}
        />
      ) : null}
    </div>
  );
}

function mapResponseToPulls(response: PlayResponse): PlayerPull[] {
  return response.pulls.map((pull) => ({
    order: pull.order,
    resultId: pull.resultId,
    gachaResult: pull.gachaResult,
  }));
}

type ProgressOverlayProps = {
  currentIndex: number;
  totalPulls: number;
  onSkipAll: () => void;
};

function BatchProgressOverlay({ currentIndex, totalPulls, onSkipAll }: ProgressOverlayProps) {
  if (typeof document === "undefined") return null;
  const remaining = Math.max(totalPulls - currentIndex - 1, 0);
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-6 z-[150] flex flex-col items-center gap-3 text-white">
      <div className="rounded-full border border-white/15 bg-white/10 px-6 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
        10連 PLAYING
      </div>
      <div className="text-sm text-white/70">
        {currentIndex + 1}/{totalPulls} ・ 残り {remaining} 回
      </div>
      <div className="flex gap-1">
        {Array.from({ length: totalPulls }).map((_, idx) => (
          <span
            key={`progress-dot-${idx}`}
            className={cn(
              "h-1.5 w-6 rounded-full",
              idx < currentIndex ? "bg-white" : idx === currentIndex ? "bg-neon-yellow animate-pulse" : "bg-white/20",
            )}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onSkipAll}
        className="pointer-events-auto rounded-full border border-white/20 bg-black/50 px-4 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-white/80 transition hover:border-white/40 hover:text-white"
      >
        10連をスキップ
      </button>
    </div>,
    document.body,
  );
}

type SummaryOverlayProps = {
  cards: {
    id: string;
    cardName: string;
    imageUrl: string;
    starRating: number;
    serialNumber: number | null;
    description?: string | null;
  }[];
  starRating: number;
  loading: boolean;
  errorMessage: string | null;
  onRetry?: () => void;
  onClose: () => void;
};

function BatchSummaryOverlay({ cards, starRating, loading, errorMessage, onRetry, onClose }: SummaryOverlayProps) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <CardReveal
      starRating={starRating}
      cards={cards}
      loading={loading}
      onClose={onClose}
      resultLabel="10連の結果"
      errorMessage={errorMessage}
      onRetry={onRetry}
      primaryCtaLabel="ガチャを閉じる"
    />,
    document.body,
  );
}

const LOADING_SHUFFLE_CARDS = [
  "/kenta_cards/card01_convenience.png",
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
  "/kenta_cards/card12_hero.png",
  "/shoichi_cards/card01_convenience.png",
  "/shoichi_cards/card02_warehouse.png",
  "/shoichi_cards/card03_youtuber.png",
  "/shoichi_cards/card04_civil_servant.png",
  "/shoichi_cards/card05_ramen.png",
  "/shoichi_cards/card06_boxer.png",
  "/shoichi_cards/card07_surgeon.png",
  "/shoichi_cards/card08_business_owner.png",
  "/shoichi_cards/card09_mercenary.png",
  "/shoichi_cards/card10_rockstar.png",
  "/shoichi_cards/card11_demon_king.png",
  "/shoichi_cards/card12_hero.png",
  "/tatumi_cards/card01_convenience.png",
  "/tatumi_cards/card02_warehouse.png",
  "/tatumi_cards/card03_youtuber.png",
  "/tatumi_cards/card04_civil_servant.png",
  "/tatumi_cards/card05_ramen.png",
  "/tatumi_cards/card06_boxer.png",
  "/tatumi_cards/card07_surgeon.png",
  "/tatumi_cards/card08_business_owner.png",
  "/tatumi_cards/card09_mercenary.png",
  "/tatumi_cards/card10_rockstar.png",
  "/tatumi_cards/card11_demon_king.png",
  "/tatumi_cards/card12_hero.png",
];

function LoadingOverlay() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCardIndex((prev) => (prev + 1) % LOADING_SHUFFLE_CARDS.length);
    }, 60);
    return () => clearInterval(interval);
  }, []);

  if (typeof document === "undefined") return null;
  
  return createPortal(
    <div className="fixed inset-0 z-[140] bg-black">
      {/* カード高速シャッフル表示 */}
      <div className="relative h-full w-full">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative h-[70vh] w-full max-w-md overflow-hidden rounded-[32px] border border-white/10 bg-black/50 shadow-[0_0_45px_rgba(0,0,0,0.5)]">
            <Image
              src={LOADING_SHUFFLE_CARDS[currentCardIndex]}
              alt="シャッフル中"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
        
        {/* オーバーレイ：スピナー＋テキスト */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="flex flex-col items-center gap-6 text-white">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/20 border-t-neon-yellow" />
            <div className="space-y-2 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-white/90">10連ガチャ準備中</p>
              <p className="text-xs text-white/60">シナリオを抽選しています...</p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
