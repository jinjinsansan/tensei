"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

import { cn } from "@/lib/utils/cn";
import { buildCommonAssetPath } from "@/lib/gacha/assets";

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
  const [isSkipping, setIsSkipping] = useState(false);

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
      setCurrentIndex((prev) => Math.min(prev + 1, activePulls.length - 1));
    }
  }, [activePulls, currentIndex, skipAllRequested]);

  const handleSkipAll = useCallback(async () => {
    if (!activePulls) return;
    // すぐにskipフラグとローディングフラグを立ててUIを完全に隠す
    setIsSkipping(true);
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
    setIsSkipping(false);
    setSummaryOpen(true);
  }, [activePulls, claims]);

  const resetSession = useCallback(() => {
    setActivePulls(null);
    setSessionMeta(null);
    setCurrentIndex(0);
    setSummaryOpen(false);
    setSkipAllRequested(false);
    setIsSkipping(false);
    setClaims({});
    setCurrentPhase(null);
  }, []);

  // sessionStorage復元・同期は完全削除（パフォーマンス優先）

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
       moduleCardId: pull.gachaResult.cardId,
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
      {/* 共通動画のバックグラウンドプリロード（ページ表示時に即開始） */}
      <CommonVideoPreloader />
      <div className={cn("flex justify-center", buttonWrapperClassName)}>{button}</div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {(isLoading && !activePulls) || isSkipping ? <LoadingOverlay message={isSkipping ? "結果を集計中..." : undefined} /> : null}
      {showPlayer && currentPull && !isSkipping ? (
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
      {showProgressOverlay && !isSkipping ? (
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
  '/splash_cards_kenta/card01_convenience.png',
  '/splash_cards_kenta/card02_warehouse.png',
  '/splash_cards_kenta/card03_youtuber.png',
  '/splash_cards_kenta/card04_civil_servant.png',
  '/splash_cards_kenta/card05_ramen.png',
  '/splash_cards_kenta/card06_boxer.png',
  '/splash_cards_kenta/card07_surgeon.png',
  '/splash_cards_kenta/card08_business_owner.png',
  '/splash_cards_kenta/card09_mercenary.png',
  '/splash_cards_kenta/card10_rockstar.png',
  '/splash_cards_kenta/card11_demon_king.png',
  '/splash_cards_kenta/card12_hero.png',
  '/splash_cards_shoichi/shoichi_card01_fish.png',
  '/splash_cards_shoichi/shoichi_card02_train.png',
  '/splash_cards_shoichi/shoichi_card03_host.png',
  '/splash_cards_shoichi/shoichi_card04_rehire.png',
  '/splash_cards_shoichi/shoichi_card05_bear.png',
  '/splash_cards_shoichi/shoichi_card06_ikemen.png',
  '/splash_cards_shoichi/shoichi_card07_beach_bar.png',
  '/splash_cards_shoichi/shoichi_card08_revenge_boss.png',
  '/splash_cards_shoichi/shoichi_card09_youth_love.png',
  '/splash_cards_shoichi/shoichi_card10_happy_family.png',
  '/splash_cards_shoichi/shoichi_card11_pilot.png',
  '/splash_cards_shoichi/shoichi_card12_investor.png',
  '/splash_cards_tatumi/tatumi_card01.png',
  '/splash_cards_tatumi/tatumi_card02.png',
  '/splash_cards_tatumi/tatumi_card03.png',
  '/splash_cards_tatumi/tatumi_card04.png',
  '/splash_cards_tatumi/tatumi_card05.png',
  '/splash_cards_tatumi/tatumi_card06.png',
  '/splash_cards_tatumi/tatumi_card07.png',
  '/splash_cards_tatumi/tatumi_card08.png',
  '/splash_cards_tatumi/tatumi_card09.png',
  '/splash_cards_tatumi/tatumi_card10.png',
  '/splash_cards_tatumi/tatumi_card11.png',
  '/splash_cards_tatumi/tatumi_card12.png',
  '/splash_cards_yahei/yahei_card01.png',
  '/splash_cards_yahei/yahei_card02.png',
  '/splash_cards_yahei/yahei_card03.png',
  '/splash_cards_yahei/yahei_card04.png',
  '/splash_cards_yahei/yahei_card05.png',
  '/splash_cards_yahei/yahei_card06.png',
  '/splash_cards_yahei/yahei_card07.png',
  '/splash_cards_yahei/yahei_card08.png',
  '/splash_cards_yahei/yahei_card09.png',
  '/splash_cards_yahei/yahei_card10.png',
  '/splash_cards_yahei/yahei_card11.png',
  '/splash_cards_yahei/yahei_card12.png',
];

function LoadingOverlay({ message }: { message?: string }) {
  // ランダムに12枚を選択（マウント時1回のみ）
  const [shuffleCards] = useState(() => {
    const shuffled = [...LOADING_SHUFFLE_CARDS];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 12);
  });

  if (typeof document === "undefined") return null;

  const displayMessage = message ?? "シナリオを抽選しています...";
  // アニメーション1サイクル = 12枚 × 80ms = 960ms ≒ 1s
  const totalDuration = shuffleCards.length * 80;

  return createPortal(
    <div className="fixed inset-0 z-[140] bg-black">
      <div className="relative h-full w-full">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative h-[70vh] w-full max-w-md overflow-hidden rounded-[32px] border border-white/10 bg-black/50 shadow-[0_0_45px_rgba(0,0,0,0.5)]">
            {shuffleCards.map((src, idx) => (
              <div
                key={src}
                className="absolute inset-0"
                style={{
                  animation: `shuffleCard ${totalDuration}ms steps(1) infinite`,
                  animationDelay: `${idx * 80}ms`,
                  opacity: 0,
                }}
              >
                <Image src={src} alt="" fill className="object-cover" priority={idx === 0} />
              </div>
            ))}
          </div>
        </div>

        {/* オーバーレイ：スピナー＋テキスト */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black/30 via-black/20 to-black/40">
          <div className="flex flex-col items-center gap-6 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/30 border-t-neon-yellow shadow-[0_0_20px_rgba(255,246,92,0.6)]" />
            <div className="space-y-2 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">10連ガチャ準備中</p>
              <p className="text-xs text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">{displayMessage}</p>
            </div>
          </div>
        </div>

        {/* 注意事項 */}
        <div className="pointer-events-none absolute bottom-8 left-0 right-0 flex justify-center px-6">
          <div className="flex items-start gap-2 rounded-2xl border border-yellow-500/30 bg-black/60 px-4 py-3 backdrop-blur-sm">
            <span className="text-yellow-400">⚠</span>
            <p className="text-[0.7rem] leading-relaxed text-yellow-100/90">
              ブラウザの戻るボタンや閉じる操作は行わないでください。
              <br className="hidden sm:inline" />
              <span className="sm:ml-1">中断すると演出がスキップされます。</span>
            </p>
          </div>
        </div>
      </div>

      {/* CSS keyframe定義 */}
      <style>{`
        @keyframes shuffleCard {
          0% { opacity: 1; }
          ${Math.round(100 / shuffleCards.length)}% { opacity: 0; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>,
    document.body,
  );
}

// ガチャページ表示時に共通動画を全てバックグラウンドプリロードする
const COMMON_PRELOAD_VIDEOS: string[] = [
  buildCommonAssetPath('standby', 'blackstandby.mp4'),
  buildCommonAssetPath('standby', 'bluestandby.mp4'),
  buildCommonAssetPath('standby', 'yellowstandby.mp4'),
  buildCommonAssetPath('standby', 'redstandby.mp4'),
  buildCommonAssetPath('standby', 'whitestandby.mp4'),
  buildCommonAssetPath('standby', 'rainbowstandby.mp4'),
  buildCommonAssetPath('puchun', 'puchun.mp4'),
  buildCommonAssetPath('countdown', 'cd_green_1.mp4'),
  buildCommonAssetPath('countdown', 'cd_green_2.mp4'),
  buildCommonAssetPath('countdown', 'cd_green_3.mp4'),
  buildCommonAssetPath('countdown', 'cd_green_4.mp4'),
  buildCommonAssetPath('countdown', 'cd_green_5.mp4'),
  buildCommonAssetPath('countdown', 'cd_green_6.mp4'),
  buildCommonAssetPath('countdown', 'cd_green_7.mp4'),
  buildCommonAssetPath('countdown', 'cd_green_8.mp4'),
  buildCommonAssetPath('countdown', 'cd_blue_1.mp4'),
  buildCommonAssetPath('countdown', 'cd_blue_2.mp4'),
  buildCommonAssetPath('countdown', 'cd_blue_3.mp4'),
  buildCommonAssetPath('countdown', 'cd_blue_4.mp4'),
  buildCommonAssetPath('countdown', 'cd_blue_5.mp4'),
  buildCommonAssetPath('countdown', 'cd_blue_6.mp4'),
  buildCommonAssetPath('countdown', 'cd_blue_7.mp4'),
  buildCommonAssetPath('countdown', 'cd_blue_8.mp4'),
  buildCommonAssetPath('countdown', 'cd_red_1.mp4'),
  buildCommonAssetPath('countdown', 'cd_red_2.mp4'),
  buildCommonAssetPath('countdown', 'cd_red_3.mp4'),
  buildCommonAssetPath('countdown', 'cd_red_4.mp4'),
  buildCommonAssetPath('countdown', 'cd_red_5.mp4'),
  buildCommonAssetPath('countdown', 'cd_red_6.mp4'),
  buildCommonAssetPath('countdown', 'cd_red_7.mp4'),
  buildCommonAssetPath('countdown', 'cd_red_8.mp4'),
];

function CommonVideoPreloader() {
  return (
    <div className="hidden" aria-hidden="true">
      {COMMON_PRELOAD_VIDEOS.map((src) => (
        <video key={src} src={src} preload="auto" playsInline muted />
      ))}
    </div>
  );
}
