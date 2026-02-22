"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

import { cn } from "@/lib/utils/cn";
import { BattleGachaPlayer } from "@/components/gacha/BattleGachaPlayer";
import { RoundMetalButton } from "@/components/gacha/controls/round-metal-button";
import { CardReveal } from "@/components/gacha/CardReveal";
import { playBattleGacha } from "@/lib/api/battle-gacha";
import { claimGachaResult } from "@/lib/api/gacha";
import type { GachaResult } from "@/lib/gacha/common/types";

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
  containerClassName?: string;
  buttonWrapperClassName?: string;
  onSessionActive?: (active: boolean) => void;
};

export function BattleGachaNeonPlayer({ containerClassName, buttonWrapperClassName, onSessionActive }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [activePulls, setActivePulls] = useState<PlayerPull[] | null>(null);
  const [totalPulls, setTotalPulls] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [skipAllRequested, setSkipAllRequested] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [claims, setClaims] = useState<Record<string, ClaimState>>({});
  const [error, setError] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  const activePullsRef = useRef<PlayerPull[] | null>(null);
  const claimsRef = useRef<Record<string, ClaimState>>({});

  const isDisabled = isLoading || Boolean(activePulls);

  useEffect(() => {
    claimsRef.current = claims;
  });

  // beforeunload warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!activePullsRef.current) return;
      const unclaimed = activePullsRef.current.filter(
        (p) => p.resultId && !claimsRef.current[p.resultId]?.serialNumber,
      );
      if (!unclaimed.length) return;
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const startPlay = useCallback(async () => {
    if (isDisabled) return;
    setError(null);
    setIsLoading(true);
    onSessionActive?.(true);
    await new Promise((r) => setTimeout(r, 50));
    try {
      const response = await playBattleGacha();
      const pulls: PlayerPull[] = response.pulls.map((p) => ({
        order: p.order,
        resultId: p.resultId,
        gachaResult: p.gachaResult,
      }));
      setActivePulls(pulls);
      activePullsRef.current = pulls;
      setTotalPulls(response.session.totalPulls);
      setCurrentIndex(0);
      setSummaryOpen(false);
      setSkipAllRequested(false);
      setClaims({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "バトルガチャを開始できませんでした。");
      onSessionActive?.(false);
    } finally {
      setIsLoading(false);
    }
  }, [isDisabled, onSessionActive]);

  const ensureClaimForResult = useCallback((resultId: string) => {
    if (!resultId) return;
    setClaims((prev) => {
      const existing = prev[resultId];
      if (existing?.loading || existing?.serialNumber != null) return prev;
      return { ...prev, [resultId]: { serialNumber: null, loading: true, error: null } };
    });
    void claimGachaResult(resultId)
      .then((res) => {
        setClaims((prev) => ({ ...prev, [resultId]: { serialNumber: res.serialNumber ?? null, loading: false, error: null } }));
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "確定に失敗しました。";
        setClaims((prev) => ({ ...prev, [resultId]: { serialNumber: prev[resultId]?.serialNumber ?? null, loading: false, error: msg } }));
      });
  }, []);

  const handleResultResolved = useCallback(({ resultId, serialNumber }: { resultId: string | null; serialNumber: number | null }) => {
    if (!resultId) return;
    setClaims((prev) => ({ ...prev, [resultId]: { serialNumber, loading: false, error: null } }));
  }, []);

  const handlePlayerClose = useCallback(() => {
    if (!activePulls) return;
    const isLast = currentIndex >= activePulls.length - 1;
    if (skipAllRequested || isLast) {
      setSummaryOpen(true);
    } else {
      setCurrentIndex((prev) => Math.min(prev + 1, activePulls.length - 1));
    }
  }, [activePulls, currentIndex, skipAllRequested]);

  const handleSkipAll = useCallback(async () => {
    if (!activePulls) return;
    setIsSkipping(true);
    setSkipAllRequested(true);
    setCurrentPhase(null);
    const promises = activePulls
      .filter((p) => p.resultId && !claims[p.resultId])
      .map((p) => {
        if (!p.resultId) return Promise.resolve();
        return claimGachaResult(p.resultId)
          .then((res) => {
            setClaims((prev) => ({ ...prev, [p.resultId!]: { serialNumber: res.serialNumber ?? null, loading: false, error: null } }));
          })
          .catch((err) => {
            const msg = err instanceof Error ? err.message : "確定に失敗しました。";
            setClaims((prev) => ({ ...prev, [p.resultId!]: { serialNumber: null, loading: false, error: msg } }));
          });
      });
    await Promise.allSettled(promises);
    setIsSkipping(false);
    setSummaryOpen(true);
  }, [activePulls, claims]);

  const resetSession = useCallback(() => {
    setActivePulls(null);
    activePullsRef.current = null;
    setTotalPulls(0);
    setCurrentIndex(0);
    setSummaryOpen(false);
    setSkipAllRequested(false);
    setIsSkipping(false);
    setClaims({});
    setCurrentPhase(null);
    onSessionActive?.(false);
  }, [onSessionActive]);

  useEffect(() => {
    if (!summaryOpen || !activePulls) return;
    activePulls.forEach((p) => {
      if (!p.resultId) return;
      if (!claims[p.resultId]) ensureClaimForResult(p.resultId);
    });
  }, [summaryOpen, activePulls, claims, ensureClaimForResult]);

  const currentPull = activePulls && currentIndex < totalPulls ? activePulls[currentIndex] : null;
  const showPlayer = Boolean(currentPull) && !summaryOpen && !skipAllRequested;
  const showProgressOverlay = showPlayer && activePulls && currentPhase !== 'CARD_REVEAL';

  const summaryCards = useMemo(() => {
    if (!activePulls) return [];
    return activePulls.map((p, i) => ({
      id: p.resultId ?? `${p.gachaResult.cardId}-${i}`,
      cardName: p.gachaResult.cardName,
      imageUrl: p.gachaResult.cardImagePath,
      starRating: p.gachaResult.starRating,
      moduleCardId: p.gachaResult.cardId,
      serialNumber: p.resultId ? claims[p.resultId]?.serialNumber ?? null : null,
      description: p.gachaResult.cardTitle,
    }));
  }, [activePulls, claims]);

  const summaryStarRating = useMemo(() => {
    if (!activePulls?.length) return 0;
    return activePulls.reduce((max, p) => Math.max(max, p.gachaResult.starRating), 0);
  }, [activePulls]);

  const summaryLoading = useMemo(() => {
    if (!activePulls) return false;
    return activePulls.some((p) => p.resultId && claims[p.resultId]?.loading);
  }, [activePulls, claims]);

  const erroredResultId = useMemo(() => {
    if (!activePulls) return null;
    for (const p of activePulls) {
      if (p.resultId && claims[p.resultId]?.error) return p.resultId;
    }
    return null;
  }, [activePulls, claims]);

  const ctaLabel = currentIndex >= totalPulls - 1 ? "結果一覧へ" : "次のバトルへ";

  return (
    <div className={cn("space-y-3 text-center", containerClassName)}>
      <div className={cn("flex justify-center", buttonWrapperClassName)}>
        <RoundMetalButton
          label={"バトル\nガチャ"}
          subLabel="START"
          onClick={startPlay}
          disabled={isDisabled}
        />
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {(isLoading && !activePulls) || isSkipping
        ? <BattleLoadingOverlay message={isSkipping ? "結果を集計中..." : undefined} />
        : null}
      {showPlayer && currentPull && !isSkipping ? (
        <BattleGachaPlayer
          gachaResult={currentPull.gachaResult}
          onClose={handlePlayerClose}
          resultId={currentPull.resultId}
          onResultResolved={handleResultResolved}
          cardRevealCtaLabel={ctaLabel}
          onCurrentPhaseChange={setCurrentPhase}
        />
      ) : null}
      {showProgressOverlay && !isSkipping ? (
        <BattleProgressOverlay
          currentIndex={currentIndex}
          totalPulls={totalPulls}
          onSkipAll={handleSkipAll}
        />
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

function BattleProgressOverlay({ currentIndex, totalPulls, onSkipAll }: { currentIndex: number; totalPulls: number; onSkipAll: () => void }) {
  if (typeof document === "undefined") return null;
  const remaining = Math.max(totalPulls - currentIndex - 1, 0);
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-6 z-[150] flex flex-col items-center gap-3 text-white">
      <div className="rounded-full border border-[#ff6fb0]/30 bg-[#ff6fb0]/10 px-6 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#ff8ec5]">
        BATTLE PLAYING
      </div>
      <div className="text-sm text-white/70">{currentIndex + 1}/{totalPulls} ・ 残り {remaining} 回</div>
      <div className="flex gap-1">
        {Array.from({ length: totalPulls }).map((_, idx) => (
          <span
            key={`dot-${idx}`}
            className={cn(
              "h-1.5 w-6 rounded-full",
              idx < currentIndex ? "bg-[#ff6fb0]" : idx === currentIndex ? "bg-yellow-400 animate-pulse" : "bg-white/20",
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

function BatchSummaryOverlay({ cards, starRating, loading, errorMessage, onRetry, onClose }: {
  cards: { id: string; cardName: string; imageUrl: string; starRating: number; serialNumber: number | null; description?: string | null }[];
  starRating: number;
  loading: boolean;
  errorMessage: string | null;
  onRetry?: () => void;
  onClose: () => void;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <CardReveal
      starRating={starRating}
      cards={cards}
      loading={loading}
      onClose={onClose}
      resultLabel="バトルガチャ 10連の結果"
      errorMessage={errorMessage}
      onRetry={onRetry}
      primaryCtaLabel="バトルガチャを閉じる"
    />,
    document.body,
  );
}

const BATTLE_LOADING_CARDS = [
  '/kenta_cards_v2/kenta_card01.png',
  '/kenta_cards_v2/kenta_card06.png',
  '/kenta_cards_v2/kenta_card12.png',
  '/splash_cards_shoichi/shoichi_card01_fish.png',
  '/splash_cards_shoichi/shoichi_card06_ikemen.png',
  '/splash_cards_shoichi/shoichi_card12_investor.png',
];

function BattleLoadingOverlay({ message }: { message?: string }) {
  const [shuffleCards] = useState(() => {
    const arr = [...BATTLE_LOADING_CARDS];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });
  if (typeof document === "undefined") return null;
  const totalDuration = shuffleCards.length * 120;

  return createPortal(
    <div className="fixed inset-0 z-[140] bg-black">
      <div className="relative h-full w-full">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative h-[70vh] w-full max-w-md overflow-hidden rounded-[32px] border border-[#ff6fb0]/20 bg-black/50">
            {shuffleCards.map((src, idx) => (
              <div key={src} className="absolute inset-0" style={{ animation: `shuffleCard ${totalDuration}ms steps(1) infinite`, animationDelay: `${idx * 120}ms`, opacity: 0 }}>
                <Image src={src} alt="" fill className="object-cover" priority={idx === 0} />
              </div>
            ))}
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black/30 via-black/20 to-black/40">
          <div className="flex flex-col items-center gap-6 text-white">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#ff6fb0]/30 border-t-[#ff6fb0] shadow-[0_0_20px_rgba(255,111,176,0.6)]" />
            <div className="space-y-2 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-white">バトルガチャ準備中</p>
              <p className="text-xs text-white/80">{message ?? "バトルシナリオを抽選しています..."}</p>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes shuffleCard { 0% { opacity: 1; } ${Math.round(100 / shuffleCards.length)}% { opacity: 0; } 100% { opacity: 0; } }`}</style>
    </div>,
    document.body,
  );
}
