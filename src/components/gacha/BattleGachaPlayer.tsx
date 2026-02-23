"use client";

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { RoundMetalButton } from '@/components/gacha/controls/round-metal-button';
import { CardReveal } from '@/components/gacha/CardReveal';
import { claimGachaResult } from '@/lib/api/gacha';
import { buildCommonAssetPath } from '@/lib/gacha/assets';
import {
  chooseCountdownPatternWithProbabilities,
  getCountdownVideoPath,
  type CountdownSelection,
} from '@/lib/gacha/common/countdown-selector';
import { chooseStandbyWithProbabilities, type StandbySelection } from '@/lib/gacha/common/standby-selector';
import type { CdColor, GachaResult } from '@/lib/gacha/common/types';
import {
  triggerCardRevealVibration,
  triggerCountdownUpgrade,
  triggerPuchunVibration,
} from '@/lib/gacha/haptics';
import { useSignedAssetResolver } from '@/lib/gacha/client-assets';
import { usePresentationConfig } from '@/lib/gacha/client-presentation';
import { buildBattleVideoQueue, type BattleQueueItem } from '@/lib/gacha/battle/video-paths';

type BattlePhase = 'STANDBY' | 'COUNTDOWN' | 'PUCHUN' | 'BATTLE_QUEUE' | 'LOSS_REVEAL' | 'CARD_REVEAL';

type ResultResolutionPayload = {
  resultId: string | null;
  serialNumber: number | null;
  gachaResult: GachaResult;
};

type Props = {
  gachaResult: GachaResult | null;
  playerCharacterId?: string;
  playerStar?: number;
  enemyCharacterId?: string;
  enemyStar?: number;
  enemyCardImagePath?: string;
  enemyCardName?: string;
  playerWins?: boolean;
  onClose?: () => void;
  resultId?: string | null;
  onResultResolved?: (payload: ResultResolutionPayload) => void;
  cardRevealCtaLabel?: string;
  onCurrentPhaseChange?: (phase: string) => void;
};

export function BattleGachaPlayer({
  gachaResult,
  playerCharacterId,
  playerStar,
  enemyCharacterId,
  enemyStar,
  enemyCardImagePath = '',
  enemyCardName = '',
  playerWins,
  onClose,
  resultId,
  onResultResolved,
  cardRevealCtaLabel,
  onCurrentPhaseChange,
}: Props) {
  const portalTarget = typeof window === 'undefined' ? null : document.body;
  const isOpen = Boolean(gachaResult);

  useEffect(() => {
    if (typeof document === 'undefined' || !isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const nav = document.querySelector('nav') as HTMLElement | null;
    const prevNavDisplay = nav?.style.display;
    if (nav) nav.style.display = 'none';
    return () => {
      document.body.style.overflow = prevOverflow;
      if (nav) nav.style.display = prevNavDisplay ?? '';
    };
  }, [isOpen]);

  if (!gachaResult || !portalTarget) return null;

  const key = resultId ?? `battle-${gachaResult.characterId}-${gachaResult.cardId}`;
  return createPortal(
    <ActiveBattlePlayer
      key={key}
      gachaResult={gachaResult}
      playerCharacterId={playerCharacterId ?? gachaResult.characterId}
      playerStar={playerStar ?? gachaResult.starRating}
      enemyCharacterId={enemyCharacterId ?? 'shoichi'}
      enemyStar={enemyStar ?? 1}
      enemyCardImagePath={enemyCardImagePath ?? ''}
      enemyCardName={enemyCardName ?? ''}
      playerWins={playerWins ?? true}
      onClose={onClose}
      resultId={resultId}
      onResultResolved={onResultResolved}
      cardRevealCtaLabel={cardRevealCtaLabel}
      onCurrentPhaseChange={onCurrentPhaseChange}
    />,
    portalTarget,
  );
}

type ActiveProps = {
  gachaResult: GachaResult;
  playerCharacterId: string;
  playerStar: number;
  enemyCharacterId: string;
  enemyStar: number;
  enemyCardImagePath: string;
  enemyCardName: string;
  playerWins?: boolean;
  onClose?: () => void;
  resultId?: string | null;
  onResultResolved?: (payload: ResultResolutionPayload) => void;
  cardRevealCtaLabel?: string;
  onCurrentPhaseChange?: (phase: string) => void;
};

function ActiveBattlePlayer({
  gachaResult,
  playerCharacterId,
  playerStar,
  enemyCharacterId,
  enemyStar,
  enemyCardImagePath,
  enemyCardName,
  playerWins,
  onClose,
  resultId,
  onResultResolved,
  cardRevealCtaLabel,
  onCurrentPhaseChange,
}: ActiveProps) {
  const [phase, setPhase] = useState<BattlePhase>('STANDBY');
  const [countdownIndex, setCountdownIndex] = useState(0);
  const [queueIndex, setQueueIndex] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [serialNumber, setSerialNumber] = useState<number | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const hasClaimedRef = useRef(false);
  const countdownColorRef = useRef<CdColor | null>(null);
  const lastReadyVideoKeyRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const allowUnmuteRef = useRef(false);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bufferingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const presentation = usePresentationConfig();

  const [standbySelection] = useState<StandbySelection | null>(() =>
    chooseStandbyWithProbabilities(gachaResult.isLoss ? 'N' : gachaResult.rarity, presentation.standby),
  );
  const [countdownSelection] = useState<CountdownSelection | null>(() =>
    chooseCountdownPatternWithProbabilities(gachaResult.isLoss ? 'N' : gachaResult.rarity, presentation.countdown),
  );

  const standbyVideo = standbySelection?.videoPath ?? buildCommonAssetPath('standby', 'blackstandby.mp4');
  const puchunVideo = buildCommonAssetPath('puchun', 'puchun.mp4');
  const lossCardImage = gachaResult.lossCardImagePath ?? buildCommonAssetPath('loss_card.png');

  const countdownVideos = useMemo(
    () => countdownSelection?.pattern.steps.map((step) => getCountdownVideoPath(step)) ?? [],
    [countdownSelection],
  );

  // Battle video queue: 16本の flat list
  const battleQueue = useMemo((): BattleQueueItem[] => {
    if (gachaResult.isLoss) return [];
    return buildBattleVideoQueue(playerCharacterId, playerStar, enemyCharacterId, enemyStar, playerWins ?? true);
  }, [gachaResult.isLoss, playerCharacterId, playerStar, enemyCharacterId, enemyStar, playerWins]);

  // All sources for signed URL preloading
  const allSources = useMemo(() => [
    standbyVideo,
    ...countdownVideos,
    puchunVideo,
    ...battleQueue.map((q) => q.src),
    lossCardImage,
    enemyCardImagePath,
  ], [standbyVideo, countdownVideos, puchunVideo, battleQueue, lossCardImage, enemyCardImagePath]);

  const { resolveAssetSrc } = useSignedAssetResolver(allSources);

  // Claim result
  const ensureClaimed = useCallback((currentResultId?: string | null) => {
    if (!currentResultId || hasClaimedRef.current) return;
    setClaimError(null);
    setIsClaiming(true);
    void claimGachaResult(currentResultId)
      .then((res) => {
        hasClaimedRef.current = true;
        const serial = res.serialNumber ?? null;
        setSerialNumber(serial);
        onResultResolved?.({ resultId: currentResultId ?? null, serialNumber: serial, gachaResult });
      })
      .catch((err: unknown) => {
        hasClaimedRef.current = false;
        const msg = err instanceof Error ? err.message : '結果の確定に失敗しました。';
        setClaimError(msg);
      })
      .finally(() => setIsClaiming(false));
  }, [gachaResult, onResultResolved]);

  useEffect(() => {
    if (!resultId) return;
    const raf = requestAnimationFrame(() => ensureClaimed(resultId));
    return () => cancelAnimationFrame(raf);
  }, [resultId, ensureClaimed]);

  useEffect(() => { onCurrentPhaseChange?.(phase); }, [phase, onCurrentPhaseChange]);

  // Countdown color upgrade
  useEffect(() => {
    if (phase !== 'COUNTDOWN') { countdownColorRef.current = null; return; }
    const step = countdownSelection?.pattern.steps[countdownIndex];
    if (!step) return;
    const prev = countdownColorRef.current;
    countdownColorRef.current = step.color;
    triggerCountdownUpgrade(prev, step.color);
  }, [phase, countdownIndex, countdownSelection]);

  // Haptics
  useEffect(() => {
    if (phase === 'PUCHUN' && !gachaResult.isLoss) triggerPuchunVibration();
    if (phase === 'CARD_REVEAL') triggerCardRevealVibration(gachaResult.starRating);
  }, [phase, gachaResult]);

  // カードオーバーレイ：videoReadyになってから表示（ボタン解除後に確実に見せる）
  useEffect(() => {
    const item = phase === 'BATTLE_QUEUE' ? battleQueue[queueIndex] : null;
    if (!item?.showCardOverlay || !videoReady) {
      // showCardOverlayでない or まだ動画準備中 → 非表示にして終了
      setOverlayVisible(false);
      return;
    }
    // videoReady=true かつ showCardOverlay=true → 即表示して2.5秒後に消す
    setOverlayVisible(true);
    const hideTimer = setTimeout(() => setOverlayVisible(false), 2500);
    overlayTimerRef.current = hideTimer;
    return () => {
      clearTimeout(hideTimer);
      overlayTimerRef.current = null;
    };
  }, [phase, queueIndex, battleQueue, videoReady]);

  const startPhase = useCallback((next: BattlePhase) => {
    setVideoReady(false);
    setQueueIndex(0);
    lastReadyVideoKeyRef.current = null;
    if (next === 'CARD_REVEAL') ensureClaimed(resultId);
    setPhase(next);
  }, [ensureClaimed, resultId]);

  const progressPhase = useCallback(() => {
    switch (phase) {
      case 'STANDBY':
        startPhase('COUNTDOWN');
        return;
      case 'COUNTDOWN': {
        const total = countdownVideos.length;
        if (total > 0 && countdownIndex < total - 1) {
          setCountdownIndex((i) => i + 1);
          setVideoReady(false);
          lastReadyVideoKeyRef.current = null;
          return;
        }
        startPhase(gachaResult.isLoss ? 'CARD_REVEAL' : 'PUCHUN');
        return;
      }
      case 'PUCHUN':
        startPhase(gachaResult.isLoss ? 'LOSS_REVEAL' : 'BATTLE_QUEUE');
        return;
      case 'BATTLE_QUEUE':
        if (queueIndex < battleQueue.length - 1) {
          setQueueIndex((i) => i + 1);
          setVideoReady(false);
          lastReadyVideoKeyRef.current = null;
          return;
        }
        startPhase('CARD_REVEAL');
        return;
      case 'LOSS_REVEAL':
        startPhase('CARD_REVEAL');
        return;
      case 'CARD_REVEAL':
        onClose?.();
        return;
    }
  }, [phase, countdownVideos.length, countdownIndex, queueIndex, battleQueue.length, gachaResult.isLoss, startPhase, onClose]);

  const handleAdvance = useCallback(() => {
    if (phase !== 'CARD_REVEAL' && !videoReady) return;
    allowUnmuteRef.current = true;
    const v = videoRef.current;
    if (v) { v.muted = false; void v.play().catch(() => undefined); }
    progressPhase();
  }, [phase, videoReady, progressPhase]);

  const handleSkip = useCallback(() => {
    if (phase === 'CARD_REVEAL') return;
    allowUnmuteRef.current = true;
    const v = videoRef.current;
    if (v) { v.muted = false; void v.play().catch(() => undefined); }
    startPhase('CARD_REVEAL');
  }, [phase, startPhase]);

  // 現在の動画src
  const currentVideoSrc = useMemo((): string | null => {
    switch (phase) {
      case 'STANDBY': return standbyVideo;
      case 'COUNTDOWN': return countdownVideos[countdownIndex] ?? null;
      case 'PUCHUN': return puchunVideo;
      case 'BATTLE_QUEUE': return battleQueue[queueIndex]?.src ?? null;
      default: return null;
    }
  }, [phase, countdownVideos, countdownIndex, puchunVideo, standbyVideo, battleQueue, queueIndex]);

  // 転生映像のどちらのカードを表示するか
  // queueIndex=8 → 自キャラ転生 → 当選カード（自キャラのカード）
  // overlayFor フラグで自キャラ/敵キャラのカードを切り替え
  const currentOverlayFor = battleQueue[queueIndex]?.overlayFor;
  const isEnemyOverlay = currentOverlayFor === 'enemy';
  const overlayCardImage = isEnemyOverlay && enemyCardImagePath
    ? enemyCardImagePath
    : gachaResult.cardImagePath;
  const overlayStarRating = isEnemyOverlay ? enemyStar : gachaResult.starRating;
  const overlayCardName = isEnemyOverlay ? enemyCardName : gachaResult.cardName;

  const videoKey = `${phase}-${queueIndex}-${countdownIndex}`;
  const isLoopPhase = phase === 'STANDBY';
  const signedVideoSrc = resolveAssetSrc(currentVideoSrc);
  const signedLossCardImage = resolveAssetSrc(lossCardImage);
  const hasVideo = Boolean(currentVideoSrc);
  const isOverlayActive = phase === 'BATTLE_QUEUE' && overlayVisible;
  const controlsLocked = hasVideo && phase !== 'CARD_REVEAL' && !videoReady;
  const skipDisabled = phase === 'CARD_REVEAL';
  const nextDisabled = phase === 'CARD_REVEAL' || controlsLocked || isOverlayActive;

  const handleVideoReady = useCallback(() => {
    if (lastReadyVideoKeyRef.current === videoKey) return;
    lastReadyVideoKeyRef.current = videoKey;
    setVideoReady(true);
  }, [videoKey]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    void v.play()
      .then(() => { if (allowUnmuteRef.current && videoRef.current) videoRef.current.muted = false; })
      .catch(() => undefined);
  }, [signedVideoSrc, videoKey]);

  // 先読みリスト（最大8本）
  const upcomingVideos = useMemo(() => {
    const list: string[] = [];
    const add = (s: string | null | undefined) => { if (s) list.push(s); };
    switch (phase) {
      case 'STANDBY':
        countdownVideos.forEach(add);
        add(puchunVideo);
        break;
      case 'COUNTDOWN':
        add(puchunVideo);
        if (!gachaResult.isLoss) {
          add(battleQueue[0]?.src);
          add(battleQueue[1]?.src);
        }
        break;
      case 'PUCHUN':
        battleQueue.slice(0, 4).forEach((q) => add(q.src));
        break;
      case 'BATTLE_QUEUE':
        battleQueue.slice(queueIndex + 1, queueIndex + 5).forEach((q) => add(q.src));
        break;
    }
    return list.slice(0, 8);
  }, [phase, countdownVideos, puchunVideo, battleQueue, queueIndex, gachaResult.isLoss]);

  if (phase === 'CARD_REVEAL') {
    return (
      <CardReveal
        starRating={gachaResult.starRating}
        cards={[{
          id: gachaResult.cardId,
          cardName: gachaResult.cardName,
          imageUrl: gachaResult.cardImagePath,
          starRating: gachaResult.starRating,
          moduleCardId: gachaResult.cardId,
          serialNumber,
          description: gachaResult.cardTitle,
        }]}
        loading={isClaiming && !serialNumber}
        onClose={() => onClose?.()}
        errorMessage={claimError}
        onRetry={resultId ? () => ensureClaimed(resultId) : undefined}
        resultLabel={gachaResult.isLoss ? 'ハズレ' : '結果'}
        primaryCtaLabel={cardRevealCtaLabel}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black"
      data-phase={phase}
    >
      <div className="relative flex h-full w-full max-w-[430px] flex-col">
        {hasVideo ? (
          <div className="relative h-full w-full overflow-hidden">
            <video
              ref={videoRef}
              key={videoKey}
              src={signedVideoSrc ?? undefined}
              className="h-full w-full object-cover"
              autoPlay
              muted
              preload="auto"
              loop={isLoopPhase}
              playsInline
              onCanPlayThrough={handleVideoReady}
              onLoadedData={handleVideoReady}
              onWaiting={() => {
                bufferingTimerRef.current = setTimeout(() => setIsBuffering(true), 800);
              }}
              onPlaying={() => {
                if (bufferingTimerRef.current) { clearTimeout(bufferingTimerRef.current); bufferingTimerRef.current = null; }
                setIsBuffering(false);
              }}
            />
            {/* カードオーバーレイ（転生映像中に大きく浮かび上がる） */}
            {phase === 'BATTLE_QUEUE' && overlayVisible && (
              <div
                className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"
                style={{ animation: 'battleCardFloat 2.5s ease-out forwards', background: 'rgba(0,0,0,0.45)' }}
              >
                <div className="relative" style={{ width: '78%', aspectRatio: '3/4' }}>
                  <Image
                    src={overlayCardImage}
                    alt={gachaResult.cardName}
                    fill
                    className="rounded-2xl object-cover shadow-[0_0_80px_rgba(255,220,100,0.9)]"
                    unoptimized
                  />
                </div>
                {/* ★表示 */}
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: overlayStarRating }).map((_, i) => (
                    <span
                      key={i}
                      className="text-yellow-300 drop-shadow-[0_0_6px_rgba(255,220,0,1)]"
                      style={{ fontSize: '1.4rem', animation: `starPop 0.3s ease-out ${i * 0.07}s both` }}
                    >★</span>
                  ))}
                </div>
                {/* カード名 */}
                <p className="text-center text-sm font-bold tracking-widest text-white drop-shadow-[0_0_8px_rgba(255,220,100,0.9)]">
                  {overlayCardName}
                </p>
              </div>
            )}
            {isBuffering && (
              <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400" />
                <span className="text-[0.6rem] font-medium tracking-widest text-yellow-300">ネットワーク低</span>
              </div>
            )}
          </div>
        ) : phase === 'LOSS_REVEAL' && signedLossCardImage ? (
          <div className="flex h-full w-full items-center justify-center">
            <Image
              src={signedLossCardImage}
              alt="転生失敗"
              width={176}
              height={256}
              unoptimized
              className="h-64 w-44 rounded-2xl border border-white/20 object-cover"
            />
          </div>
        ) : null}

        {/* Controls: LEFT (Next) | SKIP | RIGHT (Next) */}
        <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-4">
          <RoundMetalButton label="LEFT" subLabel="◀ 次へ" onClick={handleAdvance} disabled={nextDisabled} />
          <RoundMetalButton label="SKIP" subLabel="スキップ" onClick={handleSkip} disabled={skipDisabled} />
          <RoundMetalButton label="RIGHT" subLabel="次へ ▶" onClick={handleAdvance} disabled={nextDisabled} />
        </div>

        <div
          aria-hidden="true"
          style={{ position: 'fixed', top: -2, left: -2, width: 1, height: 1, opacity: 0, pointerEvents: 'none', overflow: 'hidden' }}
        >
          {upcomingVideos.map((src) => (
            <video key={src} src={resolveAssetSrc(src) ?? undefined} preload="auto" playsInline muted />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes battleCardFloat {
          0%   { opacity: 0; }
          15%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes starPop {
          0%   { opacity: 0; transform: scale(0.4); }
          70%  { transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
