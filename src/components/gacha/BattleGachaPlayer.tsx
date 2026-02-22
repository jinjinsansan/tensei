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
import type { CdColor, GachaResult, Rarity } from '@/lib/gacha/common/types';
import {
  triggerCardRevealVibration,
  triggerCountdownUpgrade,
  triggerPuchunVibration,
} from '@/lib/gacha/haptics';
import { useSignedAssetResolver } from '@/lib/gacha/client-assets';
import { usePresentationConfig } from '@/lib/gacha/client-presentation';
import {
  getBattlePreFaceVideo,
  getBattlePreShoutVideo,
  getBattlePreAttackVideo,
  getBattlePreHitVideo,
  getBattleReincarnationVideo,
  getBattleAttackVideo,
  getBattleWinVideo,
  getBattleLoseVideo,
} from '@/lib/gacha/battle/video-paths';

type BattlePhase =
  | 'STANDBY'
  | 'COUNTDOWN'
  | 'PUCHUN'
  | 'BATTLE_INTRO'
  | 'BATTLE_PRE'
  | 'BATTLE_REINCARNATION'
  | 'BATTLE_MAIN'
  | 'BATTLE_REVERSAL'
  | 'LOSS_REVEAL'
  | 'CARD_REVEAL';

type ResultResolutionPayload = {
  resultId: string | null;
  serialNumber: number | null;
  gachaResult: GachaResult;
};

type Props = {
  gachaResult: GachaResult | null;
  onClose?: () => void;
  resultId?: string | null;
  onResultResolved?: (payload: ResultResolutionPayload) => void;
  cardRevealCtaLabel?: string;
  onCurrentPhaseChange?: (phase: string) => void;
};

export function BattleGachaPlayer({ gachaResult, onClose, resultId, onResultResolved, cardRevealCtaLabel, onCurrentPhaseChange }: Props) {
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
      onClose={onClose}
      resultId={resultId}
      onResultResolved={onResultResolved}
      cardRevealCtaLabel={cardRevealCtaLabel}
      onCurrentPhaseChange={onCurrentPhaseChange}
    />,
    portalTarget,
  );
}

function ActiveBattlePlayer({
  gachaResult,
  onClose,
  resultId,
  onResultResolved,
  cardRevealCtaLabel,
  onCurrentPhaseChange,
}: Props & { gachaResult: GachaResult }) {
  const [phase, setPhase] = useState<BattlePhase>('STANDBY');
  const [countdownIndex, setCountdownIndex] = useState(0);
  const [videoIndex, setVideoIndex] = useState(0); // sub-index for multi-video phases
  const [videoReady, setVideoReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [serialNumber, setSerialNumber] = useState<number | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const hasClaimedRef = useRef(false);
  const countdownColorRef = useRef<CdColor | null>(null);
  const lastReadyVideoKeyRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const allowUnmuteRef = useRef(false);
  const cardFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bufferingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const presentation = usePresentationConfig();

  const hintRarity: Rarity = gachaResult.isLoss
    ? 'N'
    : (gachaResult.isDonden && gachaResult.dondenFromRarity)
      ? gachaResult.dondenFromRarity
      : gachaResult.rarity;

  const [standbySelection] = useState<StandbySelection | null>(() =>
    chooseStandbyWithProbabilities(hintRarity, presentation.standby),
  );
  const [countdownSelection] = useState<CountdownSelection | null>(() =>
    chooseCountdownPatternWithProbabilities(hintRarity, presentation.countdown),
  );

  const standbyVideo = standbySelection?.videoPath ?? buildCommonAssetPath('standby', 'blackstandby.mp4');
  const puchunVideo = buildCommonAssetPath('puchun', 'puchun.mp4');
  const lossCardImage = gachaResult.lossCardImagePath ?? buildCommonAssetPath('loss_card.png');

  const countdownVideos = useMemo(
    () => countdownSelection?.pattern.steps.map((step) => getCountdownVideoPath(step)) ?? [],
    [countdownSelection],
  );

  const charId = gachaResult.characterId;
  const finalStar = gachaResult.starRating;
  const lowStar = gachaResult.isDonden
    ? starFromCardId(gachaResult.dondenFromCardId)
    : finalStar;

  // Pre-compute all battle video paths
  const battleVideos = useMemo(() => ({
    face: getBattlePreFaceVideo(charId),
    shout: getBattlePreShoutVideo(charId),
    preAttack: getBattlePreAttackVideo(charId),
    preHit: getBattlePreHitVideo(charId),
    reincarnation: getBattleReincarnationVideo(charId),
    mainAttack: getBattleAttackVideo(charId, gachaResult.isDonden ? lowStar : finalStar),
    mainResult: gachaResult.isDonden
      ? getBattleLoseVideo(charId, lowStar)
      : getBattleWinVideo(charId, finalStar),
    revAttack: getBattleAttackVideo(charId, finalStar),
    revWin: getBattleWinVideo(charId, finalStar),
  }), [charId, finalStar, lowStar, gachaResult.isDonden]);

  // All video sources for signed URL resolver
  const allSources = useMemo(() => [
    standbyVideo,
    ...countdownVideos,
    puchunVideo,
    battleVideos.face,
    battleVideos.shout,
    battleVideos.preAttack,
    battleVideos.preHit,
    battleVideos.reincarnation,
    battleVideos.mainAttack,
    battleVideos.mainResult,
    battleVideos.revAttack,
    battleVideos.revWin,
    lossCardImage,
  ], [standbyVideo, countdownVideos, puchunVideo, battleVideos, lossCardImage]);

  const { resolveAssetSrc } = useSignedAssetResolver(allSources);

  // Claim on mount
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

  // Phase change reporting
  useEffect(() => {
    onCurrentPhaseChange?.(phase);
  }, [phase, onCurrentPhaseChange]);

  // Countdown color upgrade
  useEffect(() => {
    if (phase !== 'COUNTDOWN') {
      countdownColorRef.current = null;
      return;
    }
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

  // Card flash during BATTLE_REINCARNATION
  useEffect(() => {
    if (phase !== 'BATTLE_REINCARNATION') return;
    cardFlashTimerRef.current = setTimeout(() => {
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 350);
    }, 1000);
    return () => {
      if (cardFlashTimerRef.current) {
        clearTimeout(cardFlashTimerRef.current);
        cardFlashTimerRef.current = null;
      }
    };
  }, [phase]);

  const startPhase = useCallback((next: BattlePhase) => {
    setVideoReady(false);
    setVideoIndex(0);
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
        startPhase(gachaResult.isLoss ? 'LOSS_REVEAL' : 'BATTLE_INTRO');
        return;
      case 'BATTLE_INTRO':
        if (videoIndex < 1) { setVideoIndex(1); setVideoReady(false); lastReadyVideoKeyRef.current = null; return; }
        startPhase('BATTLE_PRE');
        return;
      case 'BATTLE_PRE':
        if (videoIndex < 1) { setVideoIndex(1); setVideoReady(false); lastReadyVideoKeyRef.current = null; return; }
        startPhase('BATTLE_REINCARNATION');
        return;
      case 'BATTLE_REINCARNATION':
        startPhase('BATTLE_MAIN');
        return;
      case 'BATTLE_MAIN':
        if (videoIndex < 1) { setVideoIndex(1); setVideoReady(false); lastReadyVideoKeyRef.current = null; return; }
        startPhase(gachaResult.isDonden ? 'BATTLE_REVERSAL' : 'CARD_REVEAL');
        return;
      case 'BATTLE_REVERSAL':
        if (videoIndex < 1) { setVideoIndex(1); setVideoReady(false); lastReadyVideoKeyRef.current = null; return; }
        startPhase('CARD_REVEAL');
        return;
      case 'LOSS_REVEAL':
        startPhase('CARD_REVEAL');
        return;
      case 'CARD_REVEAL':
        onClose?.();
        return;
    }
  }, [phase, countdownVideos.length, countdownIndex, videoIndex, gachaResult, startPhase, onClose]);

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

  // Compute current video src
  const currentVideoSrc = useMemo((): string | null => {
    switch (phase) {
      case 'STANDBY': return standbyVideo;
      case 'COUNTDOWN': return countdownVideos[countdownIndex] ?? null;
      case 'PUCHUN': return puchunVideo;
      case 'BATTLE_INTRO': return videoIndex === 0 ? battleVideos.face : battleVideos.shout;
      case 'BATTLE_PRE': return videoIndex === 0 ? battleVideos.preAttack : battleVideos.preHit;
      case 'BATTLE_REINCARNATION': return battleVideos.reincarnation;
      case 'BATTLE_MAIN': return videoIndex === 0 ? battleVideos.mainAttack : battleVideos.mainResult;
      case 'BATTLE_REVERSAL': return videoIndex === 0 ? battleVideos.revAttack : battleVideos.revWin;
      default: return null;
    }
  }, [phase, countdownVideos, countdownIndex, videoIndex, standbyVideo, puchunVideo, battleVideos]);

  const videoKey = `${phase}-${videoIndex}-${countdownIndex}`;
  const isLoopPhase = phase === 'STANDBY';
  const signedVideoSrc = resolveAssetSrc(currentVideoSrc);
  const signedLossCardImage = resolveAssetSrc(lossCardImage);
  const hasVideo = Boolean(currentVideoSrc);
  const controlsLocked = hasVideo && phase !== 'CARD_REVEAL' && !videoReady;
  const skipDisabled = phase === 'CARD_REVEAL';
  const nextDisabled = phase === 'CARD_REVEAL' || controlsLocked;

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
      .then(() => {
        if (allowUnmuteRef.current && videoRef.current) videoRef.current.muted = false;
      })
      .catch(() => undefined);
  }, [signedVideoSrc, videoKey]);

  // Upcoming video preloads
  const upcomingVideos = useMemo(() => {
    const list: string[] = [];
    const add = (s: string | null) => { if (s) list.push(s); };
    switch (phase) {
      case 'STANDBY':
        countdownVideos.forEach(add);
        add(puchunVideo);
        break;
      case 'COUNTDOWN':
        add(puchunVideo);
        add(battleVideos.face);
        add(battleVideos.shout);
        break;
      case 'PUCHUN':
        add(battleVideos.face);
        add(battleVideos.shout);
        add(battleVideos.preAttack);
        add(battleVideos.preHit);
        break;
      case 'BATTLE_INTRO':
        add(battleVideos.preAttack);
        add(battleVideos.preHit);
        add(battleVideos.reincarnation);
        break;
      case 'BATTLE_PRE':
        add(battleVideos.reincarnation);
        add(battleVideos.mainAttack);
        add(battleVideos.mainResult);
        break;
      case 'BATTLE_REINCARNATION':
        add(battleVideos.mainAttack);
        add(battleVideos.mainResult);
        if (gachaResult.isDonden) { add(battleVideos.revAttack); add(battleVideos.revWin); }
        break;
      case 'BATTLE_MAIN':
        if (gachaResult.isDonden) { add(battleVideos.revAttack); add(battleVideos.revWin); }
        break;
    }
    return list.slice(0, 8);
  }, [phase, countdownVideos, puchunVideo, battleVideos, gachaResult.isDonden]);

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
        {/* Video area */}
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
            {/* Card flash overlay during reincarnation */}
            {phase === 'BATTLE_REINCARNATION' && isFlashing && (
              <div
                className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
                style={{ animation: 'battleCardFlash 0.35s ease-out forwards' }}
              >
                <div className="relative" style={{ width: '65%', aspectRatio: '3/4' }}>
                  <Image
                    src={gachaResult.cardImagePath}
                    alt={gachaResult.cardName}
                    fill
                    className="rounded-2xl object-cover shadow-[0_0_40px_rgba(255,255,255,0.8)]"
                    unoptimized
                  />
                </div>
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

        {/* Controls: Left (Next) / Right (Skip) */}
        <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-8">
          <RoundMetalButton label="LEFT" subLabel="◀ 次へ" onClick={handleAdvance} disabled={nextDisabled} />
          <RoundMetalButton label="RIGHT" subLabel="スキップ ▶" onClick={handleSkip} disabled={skipDisabled} />
        </div>

        {/* Upcoming video preloads */}
        <div
          aria-hidden="true"
          style={{ position: 'fixed', top: -2, left: -2, width: 1, height: 1, opacity: 0, pointerEvents: 'none', overflow: 'hidden' }}
        >
          {upcomingVideos.map((src) => (
            <video key={src} src={resolveAssetSrc(src) ?? undefined} preload="auto" playsInline muted />
          ))}
        </div>
      </div>

      {/* CSS for card flash animation */}
      <style>{`
        @keyframes battleCardFlash {
          0%   { opacity: 0; }
          20%  { opacity: 1; }
          70%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function starFromCardId(cardId: string | undefined): number {
  if (!cardId) return 1;
  const m = cardId.match(/card(\d+)/);
  if (!m) return 1;
  return Math.max(1, parseInt(m[1], 10));
}
