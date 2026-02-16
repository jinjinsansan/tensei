"use client";

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { RoundMetalButton } from '@/components/gacha/controls/round-metal-button';
import { StarOverlay } from '@/components/gacha/overlays/StarOverlay';
import { CardReveal } from '@/components/gacha/CardReveal';
import { claimGachaResult } from '@/lib/api/gacha';

import {
  chooseCountdownPatternWithProbabilities,
  getCountdownVideoPath,
  type CountdownSelection,
} from '@/lib/gacha/common/countdown-selector';
import { chooseStandbyWithProbabilities, type StandbySelection } from '@/lib/gacha/common/standby-selector';
import { chooseTitleVideo } from '@/lib/gacha/common/title-video-selector';
import type {
  CdColor,
  CharacterModule,
  GachaPhase,
  GachaResult,
  Rarity,
  TitleVideoSelection,
} from '@/lib/gacha/common/types';
import { getCharacter } from '@/lib/gacha/characters';
import { buildCommonAssetPath } from '@/lib/gacha/assets';
import {
  triggerCardRevealVibration,
  triggerCountdownUpgrade,
  triggerDondenVibration,
  triggerPuchunVibration,
} from '@/lib/gacha/haptics';
import { playCountdownHit, primeCountdownHit } from '@/lib/gacha/sfx';
import { useSignedAssetResolver } from '@/lib/gacha/client-assets';
import { usePresentationConfig } from '@/lib/gacha/client-presentation';

type Props = {
  gachaResult: GachaResult | null;
  onClose?: () => void;
  onPhaseChange?: (phase: GachaPhase) => void;
  sessionId?: string | null;
  resultId?: string | null;
};

const PHASE_META: Record<GachaPhase, { subtitle: string; title: string }> = {
  STANDBY: { subtitle: 'PHASE 1', title: 'STANDBY' },
  COUNTDOWN: { subtitle: 'PHASE 2', title: 'COUNTDOWN' },
  PUCHUN: { subtitle: 'PHASE 3', title: 'PUCHUN' },
  TITLE_VIDEO: { subtitle: 'PHASE 3.5', title: 'TITLE VIDEO' },
  LOSS_REVEAL: { subtitle: 'LOSS ROUTE', title: '転生失敗' },
  PRE_SCENE: { subtitle: 'PHASE 4-A', title: '転生前シーン' },
  CHANCE_SCENE: { subtitle: 'PHASE 4-B', title: '転生チャンス' },
  MAIN_SCENE: { subtitle: 'PHASE 4-C', title: '転生先メイン' },
  DONDEN_SCENE: { subtitle: 'PHASE 4-D', title: 'どんでん返し' },
  CARD_REVEAL: { subtitle: 'PHASE 5', title: 'CARD REVEAL' },
};

const PRE_SCENE_PATTERNS = ['A', 'B', 'C', 'D'] as const;

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iP(hone|od|ad)/.test(navigator.userAgent);
}

function isControlsLocked(phase: GachaPhase, videoReady: boolean) {
  // CARD_REVEAL 以外のフェーズでは、動画の再生開始まではボタンをロックする
  return phase !== 'CARD_REVEAL' && !videoReady;
}

export function GachaPlayer({ gachaResult, onClose, onPhaseChange, sessionId, resultId }: Props) {
  const portalTarget = typeof window === 'undefined' ? null : document.body;
  const isOpen = Boolean(gachaResult);

  useEffect(() => {
    if (typeof document === 'undefined' || !isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const nav = document.querySelector('nav') as HTMLElement | null;
    const previousNavDisplay = nav?.style.display;
    if (nav) nav.style.display = 'none';
    return () => {
      document.body.style.overflow = previousOverflow;
      if (nav) nav.style.display = previousNavDisplay ?? '';
    };
  }, [isOpen]);

  if (!gachaResult || !portalTarget) {
    return null;
  }

  const activeKey = sessionId ?? `${gachaResult.characterId}-${gachaResult.cardId}-${gachaResult.cardTitle}`;

  return createPortal(
    <ActiveGachaPlayer
      key={activeKey}
      gachaResult={gachaResult}
      onClose={onClose}
      onPhaseChange={onPhaseChange}
      sessionKey={activeKey}
      resultId={resultId}
    />,
    portalTarget,
  );
}

type ActivePlayerProps = {
  gachaResult: GachaResult;
  onClose?: () => void;
  onPhaseChange?: (phase: GachaPhase) => void;
  sessionKey: string;
};

function ActiveGachaPlayer({ gachaResult, onClose, onPhaseChange, sessionKey, resultId }: ActivePlayerProps & { resultId?: string | null }) {
  const [phase, setPhase] = useState<GachaPhase>('STANDBY');
  const [countdownIndex, setCountdownIndex] = useState(0);
  const [preSceneIndex, setPreSceneIndex] = useState(0);
  const [mainSceneIndex, setMainSceneIndex] = useState(0);
  const [dondenIndex, setDondenIndex] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [serialNumber, setSerialNumber] = useState<number | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const hasClaimedRef = useRef(false);
  const countdownColorRef = useRef<CdColor | null>(null);
  const prevPhaseRef = useRef<GachaPhase>('STANDBY');

  const presentation = usePresentationConfig();

  const character = useMemo(() => getCharacter(gachaResult.characterId) ?? null, [gachaResult.characterId]);

  const hintRarity: Rarity | null = useMemo(() => {
    if (gachaResult.isLoss) return 'N';
    if (gachaResult.isDonden && gachaResult.dondenFromRarity) {
      return gachaResult.dondenFromRarity;
    }
    return gachaResult.rarity;
  }, [gachaResult]);

  const standbySelection: StandbySelection | null = useMemo(() => {
    if (!hintRarity) return null;
    return chooseStandbyWithProbabilities(hintRarity, presentation.standby);
  }, [hintRarity, presentation]);

  const standbyVideo = standbySelection?.videoPath ?? buildCommonAssetPath('standby', 'blackstandby.mp4');
  const lossCardImage = gachaResult.lossCardImagePath ?? buildCommonAssetPath('loss_card.png');
  const puchunVideo = buildCommonAssetPath('puchun', 'puchun.mp4');

  const countdownSelection: CountdownSelection | null = useMemo(() => {
    if (!hintRarity) return null;
    return chooseCountdownPatternWithProbabilities(hintRarity, presentation.countdown);
  }, [hintRarity, presentation]);

  const countdownVideos = useMemo(
    () => countdownSelection?.pattern.steps.map((step) => getCountdownVideoPath(step)) ?? [],
    [countdownSelection],
  );

  const titleSelection: TitleVideoSelection | null = useMemo(() => {
    if (gachaResult.isLoss || !character) return null;
    const availableCardIds = character.cards.map((card) => card.cardId);
    if (!availableCardIds.length) return null;
    const realCardId =
      gachaResult.isDonden && gachaResult.dondenFromCardId
        ? gachaResult.dondenFromCardId
        : gachaResult.cardId;
    return chooseTitleVideo(realCardId, availableCardIds, presentation.titleHintRate);
  }, [character, gachaResult, presentation.titleHintRate]);

  const titleVideoSrc = useMemo(() => {
    if (!character || !titleSelection) return null;
    return character.getTitleVideoPath(titleSelection.videoCardId);
  }, [character, titleSelection]);

  const preScenePatternId = useMemo(
    () => selectPreScenePattern(sessionKey, character, gachaResult),
    [sessionKey, character, gachaResult],
  );

  const preSceneMeta = useMemo(() => {
    if (!character || !preScenePatternId) return null;
    const pattern = character.preScenePatterns.find((entry) => entry.patternId === preScenePatternId);
    const steps = pattern?.steps ?? 0;
    if (!steps) return null;
    const videos = Array.from({ length: steps }).map((_, idx) =>
      character.getPreSceneVideoPath(preScenePatternId, idx + 1),
    );
    return { patternId: preScenePatternId, steps, videos };
  }, [character, preScenePatternId]);

  const chanceSceneVideo = useMemo(() => {
    if (!character || !preScenePatternId) return null;
    const chance =
      character.chanceScenes.find((entry) => entry.patternId === preScenePatternId) ??
      character.chanceScenes[0];
    return chance ? character.getChanceSceneVideoPath(chance.patternId) : null;
  }, [character, preScenePatternId]);

  const cardDefinition = useMemo(
    () => character?.cards.find((card) => card.cardId === gachaResult.cardId) ?? null,
    [character, gachaResult.cardId],
  );

  const mainSceneVideos = useMemo(() => {
    if (!character || !cardDefinition) return [];
    const steps = cardDefinition.mainSceneSteps ?? 0;
    return Array.from({ length: steps }).map((_, idx) =>
      character.getMainSceneVideoPath(gachaResult.cardId, idx + 1),
    );
  }, [character, cardDefinition, gachaResult.cardId]);

  const dondenRoute = useMemo(() => {
    if (!character || !gachaResult.isDonden) return null;
    const fromId = gachaResult.dondenFromCardId;
    return (
      character.dondenRoutes.find((route) => {
        if (route.toCardId !== gachaResult.cardId) return false;
        return fromId ? route.fromCardId === fromId : true;
      }) ?? null
    );
  }, [character, gachaResult]);

  const dondenVideos = useMemo(() => {
    if (!character || !dondenRoute) return [];
    return Array.from({ length: dondenRoute.steps }).map((_, idx) =>
      character.getDondenVideoPath(dondenRoute.fromCardId, dondenRoute.toCardId, idx + 1),
    );
  }, [character, dondenRoute]);

  const assetSources = useMemo(() => {
    const set = new Set<string>();
    const add = (value: string | null | undefined) => {
      if (value) set.add(value);
    };
    add(standbyVideo);
    countdownVideos.forEach((src) => add(src));
    add(puchunVideo);
    add(titleVideoSrc);
    preSceneMeta?.videos.forEach((src) => add(src));
    add(chanceSceneVideo);
    mainSceneVideos.forEach((src) => add(src));
    dondenVideos.forEach((src) => add(src));
    add(lossCardImage);
    return Array.from(set);
  }, [
    standbyVideo,
    countdownVideos,
    puchunVideo,
    titleVideoSrc,
    preSceneMeta,
    chanceSceneVideo,
    mainSceneVideos,
    dondenVideos,
    lossCardImage,
  ]);

  const resolveAssetSrc = useSignedAssetResolver(assetSources);

  const ensureClaimed = useCallback((currentResultId?: string | null) => {
    if (!currentResultId || hasClaimedRef.current) return;
    setClaimError(null);
    setIsClaiming(true);
    void claimGachaResult(currentResultId)
      .then((res) => {
        hasClaimedRef.current = true;
        setSerialNumber(res.serialNumber ?? null);
      })
      .catch((error: unknown) => {
        hasClaimedRef.current = false;
        const message = error instanceof Error ? error.message : '結果の確定に失敗しました。時間をおいて再度お試しください。';
        setClaimError(message);
      })
      .finally(() => {
        setIsClaiming(false);
      });
  }, []);

  const startPhase = useCallback(
    (nextPhase: GachaPhase) => {
      switch (nextPhase) {
        case 'COUNTDOWN':
          setCountdownIndex(0);
          break;
        case 'PRE_SCENE':
          setPreSceneIndex(0);
          break;
        case 'MAIN_SCENE':
          setMainSceneIndex(0);
          break;
        case 'DONDEN_SCENE':
          setDondenIndex(0);
          break;
        default:
          break;
      }
      if (nextPhase === 'CARD_REVEAL') {
        ensureClaimed(resultId);
      }
      setPhase(nextPhase);
    },
    [ensureClaimed, resultId],
  );

  useEffect(() => {
    onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);

  useEffect(() => {
    if (phase !== 'COUNTDOWN') {
      countdownColorRef.current = null;
      return;
    }
    // iOS 実機での遅延を減らすため、ここで事前に Audio 要素だけ用意しておく
    primeCountdownHit();
    const nextStep = countdownSelection?.pattern.steps[countdownIndex];
    if (!nextStep) return;
    const prevColor = countdownColorRef.current;
    countdownColorRef.current = nextStep.color;
    triggerCountdownUpgrade(prevColor, nextStep.color);
  }, [phase, countdownIndex, countdownSelection]);

  useEffect(() => {
    if (prevPhaseRef.current === phase) return;
    prevPhaseRef.current = phase;
    if (phase === 'PUCHUN' && !gachaResult.isLoss) {
      // playPuchunSfx(); // Removed per user request
      triggerPuchunVibration();
    } else if (phase === 'DONDEN_SCENE' && gachaResult.isDonden) {
      // playDondenSfx(); // Removed per user request
      triggerDondenVibration();
    } else if (phase === 'CARD_REVEAL') {
      if (!gachaResult.isLoss) {
        // playCardRevealCue(gachaResult.starRating); // Removed per user request
        triggerCardRevealVibration(gachaResult.starRating);
      } else {
        triggerCardRevealVibration(1);
      }
    }
  }, [phase, gachaResult]);

  const exitPlayer = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const countdownTotal = countdownVideos.length;
  const preSceneTotal = preSceneMeta?.videos.length ?? 0;
  const mainSceneTotal = mainSceneVideos.length;
  const dondenTotal = dondenVideos.length;

  const progressPhase = useCallback(() => {
      switch (phase) {
        case 'STANDBY':
          startPhase('COUNTDOWN');
          return;
        case 'COUNTDOWN':
          if (countdownTotal > 0 && countdownIndex < countdownTotal - 1) {
            setCountdownIndex((idx) => Math.min(idx + 1, countdownTotal - 1));
            return;
          }
          // ハズレ時はカウントダウン終了後に即カード結果へ遷移する
          startPhase(gachaResult.isLoss ? 'CARD_REVEAL' : 'PUCHUN');
          return;
        case 'PUCHUN':
          startPhase(gachaResult.isLoss ? 'LOSS_REVEAL' : 'TITLE_VIDEO');
          return;
        case 'TITLE_VIDEO': {
          if (preSceneTotal > 0) {
            startPhase('PRE_SCENE');
          } else if (chanceSceneVideo) {
            startPhase('CHANCE_SCENE');
          } else {
            startPhase('MAIN_SCENE');
          }
          return;
        }
        case 'PRE_SCENE':
          if (preSceneTotal > 0 && preSceneIndex < preSceneTotal - 1) {
            setPreSceneIndex((idx) => Math.min(idx + 1, preSceneTotal - 1));
            return;
          }
          startPhase(chanceSceneVideo ? 'CHANCE_SCENE' : 'MAIN_SCENE');
          return;
        case 'CHANCE_SCENE':
          startPhase('MAIN_SCENE');
          return;
        case 'MAIN_SCENE':
          if (mainSceneTotal > 0 && mainSceneIndex < mainSceneTotal - 1) {
            setMainSceneIndex((idx) => Math.min(idx + 1, mainSceneTotal - 1));
            return;
          }
          if (gachaResult.isDonden && dondenTotal > 0) {
            startPhase('DONDEN_SCENE');
          } else {
            startPhase('CARD_REVEAL');
          }
          return;
        case 'DONDEN_SCENE':
          if (dondenTotal > 0 && dondenIndex < dondenTotal - 1) {
            setDondenIndex((idx) => Math.min(idx + 1, dondenTotal - 1));
            return;
          }
          startPhase('CARD_REVEAL');
          return;
        case 'LOSS_REVEAL':
          // 現状このフェーズには遷移しない（互換用）
          startPhase('CARD_REVEAL');
          return;
        case 'CARD_REVEAL':
          exitPlayer();
          return;
        default:
          return;
      }
    },
    [
      phase,
      countdownTotal,
      countdownIndex,
      gachaResult,
      preSceneTotal,
      preSceneIndex,
      chanceSceneVideo,
      mainSceneTotal,
      mainSceneIndex,
      dondenTotal,
      dondenIndex,
      exitPlayer,
      startPhase,
    ],
  );

  const handleAdvance = useCallback(() => {
    if (isControlsLocked(phase, videoReady)) return;
    setVideoReady(false);
    progressPhase();
  }, [phase, videoReady, progressPhase]);

  const handleSkip = useCallback(() => {
    if (isControlsLocked(phase, videoReady)) return;
    if (phase === 'COUNTDOWN') {
      // ハズレ時はスキップしてもカード結果へ直行
      setVideoReady(false);
      startPhase(gachaResult.isLoss ? 'CARD_REVEAL' : 'PUCHUN');
      return;
    }
    if (phase === 'PRE_SCENE') {
      setVideoReady(false);
      startPhase('MAIN_SCENE');
    }
  }, [phase, videoReady, gachaResult, startPhase]);

  const details = buildPhaseDetails({
    phase,
    gachaResult,
    standbySelection,
    countdownSelection,
    titleSelection,
    preScenePattern: preSceneMeta?.patternId ?? null,
    character,
  });

  const phaseVideo = resolvePhaseVideo({
    phase,
    standbyVideo,
    countdownVideos,
    countdownIndex,
    puchunVideo,
    titleVideoSrc,
    preSceneMeta,
    preSceneIndex,
    chanceSceneVideo,
    mainSceneVideos,
    mainSceneIndex,
    dondenVideos,
    dondenIndex,
  });

  const signedPhaseVideoSrc = resolveAssetSrc(phaseVideo?.src ?? null);
  const signedLossCardImage = resolveAssetSrc(lossCardImage);
  const phaseVideoKey = phaseVideo ? `${phase}-${phaseVideo.key}` : `${phase}-video`;
  const phaseVideoLoop = phaseVideo?.loop ?? false;
  const hasPhaseVideo = Boolean(signedPhaseVideoSrc);
  const controlsLocked = hasPhaseVideo && isControlsLocked(phase, videoReady);
  const canSkip = (phase === 'COUNTDOWN' || phase === 'PRE_SCENE') && !controlsLocked;
  const disableNext = phase === 'CARD_REVEAL' || controlsLocked;
  const preloadedCountdownSources = countdownVideos
    .map((src) => resolveAssetSrc(src) ?? src)
    .filter((src): src is string => Boolean(src));
  const handlePhaseVideoPlay = useCallback(() => {
    setVideoReady(true);
    if (phase === 'COUNTDOWN') {
      // iPhone 実機では映像描画がわずかに遅れるため、音をほんの少し遅らせて同期感を高める
      if (isIOS()) {
        window.setTimeout(() => {
          playCountdownHit();
        }, 80);
      } else {
        playCountdownHit();
      }
    }
  }, [phase]);

  // CARD_REVEAL フェーズになったら CardReveal を表示
  if (phase === 'CARD_REVEAL') {
    const cardData = {
      id: gachaResult.cardId,
      cardName: gachaResult.cardName,
      imageUrl: gachaResult.cardImagePath,
      starRating: gachaResult.starRating,
      serialNumber,
      description: gachaResult.cardTitle,
    };

    return (
      <CardReveal
        starRating={gachaResult.starRating}
        cards={[cardData]}
        loading={isClaiming && !serialNumber}
        onClose={exitPlayer}
        errorMessage={claimError}
        onRetry={resultId ? () => ensureClaimed(resultId) : undefined}
        resultLabel={gachaResult.isLoss ? 'ハズレ' : '結果'}
      />
    );
  }

  const phaseMeta = PHASE_META[phase];

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black"
      aria-label={phaseMeta ? `${phaseMeta.subtitle} ${phaseMeta.title}` : undefined}
      data-phase={phase}
      data-phase-details={details ?? undefined}
    >
      <div className="relative flex h-full w-full max-w-[430px] flex-col">
        {/* カウントダウン用の全動画をオフスクリーンで preload して、iPhone 実機でのラグを軽減 */}
        <div className="pointer-events-none absolute -z-10 h-0 w-0 overflow-hidden">
          {preloadedCountdownSources.map((src, index) => (
            <video key={`preload-${index}`} src={src} preload="auto" playsInline muted />
          ))}
        </div>
        {signedPhaseVideoSrc ? (
          <div className="relative h-full w-full overflow-hidden">
            <video
              key={phaseVideoKey}
              src={signedPhaseVideoSrc}
              className="h-full w-full object-cover"
              autoPlay
              preload="auto"
              loop={phaseVideoLoop}
              playsInline
              onPlay={handlePhaseVideoPlay}
            />
            {phase === 'TITLE_VIDEO' && titleSelection && (
              <StarOverlay starCount={titleSelection.starDisplay} />
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

        <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-8">
          <RoundMetalButton label="NEXT" subLabel="次へ" onClick={handleAdvance} disabled={disableNext} />
          <RoundMetalButton label="SKIP" subLabel="スキップ" onClick={handleSkip} disabled={!canSkip} />
        </div>
      </div>
    </div>
  );
}

type PhaseVideoPlan = {
  src: string | null;
  loop: boolean;
  progress?: string;
  key: string;
};

function resolvePhaseVideo(args: {
  phase: GachaPhase;
  standbyVideo: string;
  countdownVideos: string[];
  countdownIndex: number;
  puchunVideo: string;
  titleVideoSrc: string | null;
  preSceneMeta: { patternId: string; steps: number; videos: string[] } | null;
  preSceneIndex: number;
  chanceSceneVideo: string | null;
  mainSceneVideos: string[];
  mainSceneIndex: number;
  dondenVideos: string[];
  dondenIndex: number;
}): PhaseVideoPlan | null {
  const {
    phase,
    standbyVideo,
    countdownVideos,
    countdownIndex,
    puchunVideo,
    titleVideoSrc,
    preSceneMeta,
    preSceneIndex,
    chanceSceneVideo,
    mainSceneVideos,
    mainSceneIndex,
    dondenVideos,
    dondenIndex,
  } = args;

  switch (phase) {
    case 'STANDBY':
      return { src: standbyVideo, loop: true, progress: 'HINT 60%', key: 'standby' };
    case 'COUNTDOWN':
      return {
        src: countdownVideos[countdownIndex] ?? null,
        loop: false,
        progress: `STEP ${countdownIndex + 1}/4`,
        key: `countdown-${countdownIndex}`,
      };
    case 'PUCHUN':
      return { src: puchunVideo, loop: false, progress: 'PUCHUN', key: 'puchun' };
    case 'TITLE_VIDEO':
      return { src: titleVideoSrc, loop: false, progress: 'TITLE', key: 'title' };
    case 'PRE_SCENE':
      return {
        src: preSceneMeta?.videos[preSceneIndex] ?? null,
        loop: false,
        progress: `SCENE ${preSceneIndex + 1}/${preSceneMeta?.videos.length ?? 0}`,
        key: `pre-${preSceneIndex}`,
      };
    case 'CHANCE_SCENE':
      return { src: chanceSceneVideo, loop: false, progress: 'CHANCE', key: 'chance' };
    case 'MAIN_SCENE':
      return {
        src: mainSceneVideos[mainSceneIndex] ?? null,
        loop: false,
        progress: `MAIN ${mainSceneIndex + 1}/${mainSceneVideos.length}`,
        key: `main-${mainSceneIndex}`,
      };
    case 'DONDEN_SCENE':
      return {
        src: dondenVideos[dondenIndex] ?? null,
        loop: false,
        progress: `DONDEN ${dondenIndex + 1}/${dondenVideos.length}`,
        key: `donden-${dondenIndex}`,
      };
    default:
      return null;
  }
}

function selectPreScenePattern(
  sessionKey: string,
  character: CharacterModule | null,
  result: GachaResult,
): string | null {
  if (result.isLoss) return null;
  const pool = character?.preScenePatterns?.map((pattern) => pattern.patternId) ?? [...PRE_SCENE_PATTERNS];
  if (!pool.length) return null;
  const index = hashString(`${sessionKey}-pre`) % pool.length;
  return pool[index];
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function buildPhaseDetails(args: {
  phase: GachaPhase;
  gachaResult: GachaResult;
  standbySelection: StandbySelection | null;
  countdownSelection: CountdownSelection | null;
  titleSelection: TitleVideoSelection | null;
  preScenePattern: string | null;
  character: CharacterModule | null;
}): string | undefined {
  const {
    phase,
    gachaResult,
    standbySelection,
    countdownSelection,
    titleSelection,
    preScenePattern,
    character,
  } = args;
  switch (phase) {
    case 'STANDBY':
      return standbySelection
        ? `待機映像: ${standbySelection.color.toUpperCase()} / ${standbySelection.videoPath}`
        : '待機映像を準備中...';
    case 'COUNTDOWN':
      if (!countdownSelection) return 'カウントダウンパターンを準備中';
      return describeCountdown(countdownSelection);
    case 'PUCHUN':
      return 'プチュン映像で当たり確定。スキップ不可。';
    case 'TITLE_VIDEO':
      return titleSelection
        ? `タイトル動画: ${titleSelection.videoCardId} / ★${titleSelection.starDisplay} · ヒント信頼度 ${titleSelection.isRealCard ? '60% (本物)' : '40% (ブラフ)'}
タップ不可の自動再生ゾーン`
        : 'タイトル動画を選択中...';
    case 'LOSS_REVEAL':
      return '転生失敗。魂の準備が整わなかったようです。';
    case 'PRE_SCENE':
      return preScenePattern ? `転生前パターン ${preScenePattern} を再生` : '転生前シーンを抽選中';
    case 'CHANCE_SCENE':
      return preScenePattern ? `チャンスシーン (${preScenePattern}) に突入` : 'チャンスシーンを準備中';
    case 'MAIN_SCENE': {
      const info = character?.getCardDisplayInfo(gachaResult.cardId);
      return info
        ? `転生先メイン演出: ${info.name} ★${info.starRating} / ${info.title}`
        : `転生先メイン演出: ${gachaResult.cardName}`;
    }
    case 'DONDEN_SCENE':
      return gachaResult.isDonden
        ? `どんでん返し: ${gachaResult.dondenFromCardId ?? '？？？'} → ${gachaResult.cardId}`
        : 'どんでん返しは発生しません';
    case 'CARD_REVEAL': {
      const info = character?.getCardDisplayInfo(gachaResult.cardId);
      return gachaResult.isLoss
        ? '仮カード表示: 転生失敗。簡易テキストで表示します。'
        : info
            ? `仮カード表示: ${info.name} ★${info.starRating} / ${info.description}`
            : `仮カード表示: ${gachaResult.cardName} ★${gachaResult.starRating}`;
    }
    default:
      return undefined;
  }
}

function describeCountdown(selection: CountdownSelection) {
  const steps = selection.pattern.steps
    .map((step) => `${emojiForColor(step.color)}${step.number}`)
    .join(' → ');
  return `演出グレード ${selection.grade} · ${selection.pattern.name} / ${steps}`;
}

function emojiForColor(color: CountdownSelection['pattern']['steps'][number]['color']) {
  switch (color) {
    case 'green':
      return '🟢';
    case 'blue':
      return '🔵';
    case 'red':
      return '🔴';
    case 'rainbow':
    default:
      return '🌈';
  }
}
