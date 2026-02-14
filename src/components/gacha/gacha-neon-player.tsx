"use client";

import { useCallback, useMemo, useState } from "react";

import { GachaPlayer } from "@/components/gacha/GachaPlayer";
import { CardReveal } from "@/components/gacha/card-reveal";
import { RoundMetalButton } from "@/components/gacha/controls/round-metal-button";
import { claimGachaResult, playGacha, type CardSummary } from "@/lib/api/gacha";
import type { GachaResult } from "@/lib/gacha/common/types";

type PlayVariant = "round" | "default";

type Props = {
  playLabel?: string;
  playVariant?: PlayVariant;
};

export function GachaNeonPlayer({ playLabel = "ガチャを始める", playVariant = "round" }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeResult, setActiveResult] = useState<GachaResult | null>(null);
  const [displayResult, setDisplayResult] = useState<GachaResult | null>(null);
  const [cardSummary, setCardSummary] = useState<CardSummary | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [cardRevealOpen, setCardRevealOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  const isDisabled = isLoading || Boolean(activeResult) || cardRevealOpen;

  const startPlay = useCallback(async () => {
    if (isDisabled) return;
    setError(null);
    setClaimError(null);
    setCardRevealOpen(false);
    try {
      setIsLoading(true);
      const response = await playGacha();
      setActiveResult(response.gachaResult);
      setDisplayResult(response.gachaResult);
      setCardSummary(response.card);
      setResultId(response.resultId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ガチャを開始できませんでした。");
    } finally {
      setIsLoading(false);
    }
  }, [isDisabled]);

  const handlePlayerClose = useCallback(async () => {
    setActiveResult(null);
    if (!resultId) {
      setCardRevealOpen(true);
      return;
    }
    setIsClaiming(true);
    setClaimError(null);
    try {
      const response = await claimGachaResult(resultId);
      setCardSummary(response.card);
      setDisplayResult(response.gachaResult);
      setResultId(null);
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : "結果の確定に失敗しました。");
    } finally {
      setIsClaiming(false);
      setCardRevealOpen(true);
    }
  }, [resultId]);

  const handleRevealClose = useCallback(() => {
    setCardRevealOpen(false);
    setDisplayResult(null);
    setCardSummary(null);
    setClaimError(null);
  }, []);

  const button = useMemo(() => {
    if (playVariant === "round") {
      return (
        <RoundMetalButton
          label={playLabel}
          subLabel="START"
          onClick={startPlay}
          disabled={isDisabled}
        />
      );
    }
    return (
      <button
        type="button"
        onClick={startPlay}
        disabled={isDisabled}
        className="w-full max-w-md rounded-[14px] border border-white/20 bg-gradient-to-b from-white/85 to-white/50 px-8 py-4 text-base font-bold tracking-[0.08em] text-[#1a2230] shadow-[0_14px_30px_rgba(0,0,0,0.28),inset_0_2px_0_rgba(255,255,255,0.85),inset_0_-3px_0_rgba(0,0,0,0.2)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "準備中..." : playLabel}
      </button>
    );
  }, [playLabel, playVariant, startPlay, isDisabled, isLoading]);

  return (
    <div className="space-y-3 text-center">
      <div className="flex justify-center">{button}</div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <GachaPlayer gachaResult={activeResult} onClose={handlePlayerClose} sessionId={resultId ?? undefined} />
      <CardReveal
        open={cardRevealOpen}
        gachaResult={displayResult}
        card={cardSummary}
        isClaiming={isClaiming}
        error={claimError}
        onClose={handleRevealClose}
      />
    </div>
  );
}
