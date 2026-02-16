"use client";

import { useCallback, useMemo, useState } from "react";

import { cn } from "@/lib/utils/cn";

import { GachaPlayer } from "@/components/gacha/GachaPlayer";
import { RoundMetalButton } from "@/components/gacha/controls/round-metal-button";
import { playGacha } from "@/lib/api/gacha";
import type { GachaResult } from "@/lib/gacha/common/types";

type PlayVariant = "round" | "default" | "button";

type Props = {
  playLabel?: string;
  playVariant?: PlayVariant;
  className?: string;
  containerClassName?: string;
  buttonWrapperClassName?: string;
};

export function GachaNeonPlayer({
  playLabel = "ガチャを\n始める",
  playVariant = "round",
  className,
  containerClassName,
  buttonWrapperClassName,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeResult, setActiveResult] = useState<GachaResult | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDisabled = isLoading || Boolean(activeResult);

  const startPlay = useCallback(async () => {
    if (isDisabled) return;
    setError(null);
    try {
      setIsLoading(true);
      const response = await playGacha();
      setActiveResult(response.gachaResult);
      setResultId(response.resultId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ガチャを開始できませんでした。");
    } finally {
      setIsLoading(false);
    }
  }, [isDisabled]);

  const handlePlayerClose = useCallback(() => {
    setActiveResult(null);
    setResultId(null);
  }, []);

  const normalizedLabel = typeof playLabel === "string" ? playLabel.replace(/\\n/g, "\n") : playLabel;

  const button = useMemo(() => {
    if (playVariant === "round") {
      return (
        <RoundMetalButton
          label={normalizedLabel}
          subLabel="START"
          onClick={startPlay}
          disabled={isDisabled}
        />
      );
    }
    if (playVariant === "button") {
      return (
        <button
          type="button"
          onClick={startPlay}
          disabled={isDisabled}
          className={className}
        >
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

  return (
    <div className={cn("space-y-3 text-center", containerClassName)}>
      <div className={cn("flex justify-center", buttonWrapperClassName)}>{button}</div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <GachaPlayer
        gachaResult={activeResult}
        onClose={handlePlayerClose}
        sessionId={resultId ?? undefined}
        resultId={resultId ?? undefined}
      />
      {/* GachaPlayer 内のカードリビールを正式版として使用するため、旧RESULTモーダルは撤去 */}
    </div>
  );
}
