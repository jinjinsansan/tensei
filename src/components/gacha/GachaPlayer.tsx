"use client";

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { RoundMetalButton } from '@/components/gacha/controls/round-metal-button';
import { PhasePlaceholder } from '@/components/gacha/phases/phase-placeholder';
import {
  chooseCountdownPattern,
  getCountdownVideoPath,
  type CountdownSelection,
} from '@/lib/gacha/common/countdown-selector';
import { chooseStandby, type StandbySelection } from '@/lib/gacha/common/standby-selector';
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
import { playCardRevealCue, playCountdownTone, playDondenSfx, playPuchunSfx } from '@/lib/gacha/sfx';
import { useSignedAssetResolver } from '@/lib/gacha/client-assets';

type Props = {
  gachaResult: GachaResult | null;
  onClose?: () => void;
  onPhaseChange?: (phase: GachaPhase) => void;
  sessionId?: string | null;
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
const AUTO_PHASES: GachaPhase[] = ['PUCHUN', 'TITLE_VIDEO', 'CHANCE_SCENE', 'MAIN_SCENE', 'DONDEN_SCENE'];

export function GachaPlayer({ gachaResult, onClose, onPhaseChange, sessionId }: Props) {
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

function ActiveGachaPlayer({ gachaResult, onClose, onPhaseChange, sessionKey }: ActivePlayerProps) {
  const [phase, setPhase] = useState<GachaPhase>('STANDBY');
  const [countdownIndex, setCountdownIndex] = useState(0);
  const [preSceneIndex, setPreSceneIndex] = useState(0);
  const [mainSceneIndex, setMainSceneIndex] = useState(0);
  const [dondenIndex, setDondenIndex] = useState(0);
  const countdownColorRef = useRef<CdColor | null>(null);
  const prevPhaseRef = useRef<GachaPhase>('STANDBY');

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
    return chooseStandby(hintRarity);
  }, [hintRarity]);

  const standbyVideo = standbySelection?.videoPath ?? buildCommonAssetPath('standby', 'blackstandby.mp4');
  const lossCardImage = gachaResult.lossCardImagePath ?? buildCommonAssetPath('loss_card.png');
  const puchunVideo = buildCommonAssetPath('puchun', 'puchun.mp4');

  const countdownSelection: CountdownSelection | null = useMemo(() => {
    if (!hintRarity) return null;
    return chooseCountdownPattern(hintRarity);
  }, [hintRarity]);

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
    return chooseTitleVideo(realCardId, availableCardIds);
  }, [character, gachaResult]);

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

  const startPhase = useCallback((nextPhase: GachaPhase) => {
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
    setPhase(nextPhase);
  }, []);

  useEffect(() => {
    onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);

  useEffect(() => {
    if (phase !== 'COUNTDOWN') {
      countdownColorRef.current = null;
      return;
    }
    const nextStep = countdownSelection?.pattern.steps[countdownIndex];
    if (!nextStep) return;
    playCountdownTone(nextStep.color);
    const prevColor = countdownColorRef.current;
    countdownColorRef.current = nextStep.color;
    triggerCountdownUpgrade(prevColor, nextStep.color);
  }, [phase, countdownIndex, countdownSelection]);

  useEffect(() => {
    if (prevPhaseRef.current === phase) return;
    prevPhaseRef.current = phase;
    if (phase === 'PUCHUN' && !gachaResult.isLoss) {
      playPuchunSfx();
      triggerPuchunVibration();
    } else if (phase === 'DONDEN_SCENE' && gachaResult.isDonden) {
      playDondenSfx();
      triggerDondenVibration();
    } else if (phase === 'CARD_REVEAL') {
      if (!gachaResult.isLoss) {
        playCardRevealCue(gachaResult.starRating);
        triggerCardRevealVibration(gachaResult.starRating);
      } else {
        triggerCardRevealVibration(1);
      }
    }
  }, [phase, gachaResult]);

  const exitPlayer = useCallback(() => {
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (phase === 'LOSS_REVEAL' || phase === 'CARD_REVEAL') {
      const timer = setTimeout(() => exitPlayer(), 1800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [phase, exitPlayer]);

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
          startPhase(gachaResult.isLoss ? 'LOSS_REVEAL' : 'PUCHUN');
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
    if (AUTO_PHASES.includes(phase)) return;
    progressPhase();
  }, [phase, progressPhase]);

  const handleSkip = useCallback(() => {
    if (phase === 'COUNTDOWN') {
      startPhase(gachaResult.isLoss ? 'LOSS_REVEAL' : 'PUCHUN');
      return;
    }
    if (phase === 'PRE_SCENE') {
      startPhase('MAIN_SCENE');
    }
  }, [phase, gachaResult, startPhase]);

  const canSkip = phase === 'COUNTDOWN' || phase === 'PRE_SCENE';
  const disableNext = AUTO_PHASES.includes(phase);

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

  const shouldAutoAdvanceOnEnd = AUTO_PHASES.includes(phase);
  const signedPhaseVideoSrc = resolveAssetSrc(phaseVideo?.src ?? null);
  const signedLossCardImage = resolveAssetSrc(lossCardImage);
  const phaseVideoKey = phaseVideo ? `${phase}-${phaseVideo.key}` : `${phase}-video`;
  const phaseVideoLoop = phaseVideo?.loop ?? false;

  return (
    <div className="fixed inset-0 z-[140] flex flex-col bg-gradient-to-b from-black via-black/95 to-black text-white">
      <div className="flex w-full items-center justify-between border-b border-white/10 px-6 py-4 text-xs uppercase tracking-[0.35em] text-white/60">
        <span>来世ガチャ</span>
        <span>
          {PHASE_META[phase].subtitle} · {PHASE_META[phase].title}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-6 py-8">
        <div className="relative flex-1 overflow-hidden rounded-[32px] border border-white/10 bg-black/70 shadow-[0_35px_90px_rgba(0,0,0,0.85)]">
          {signedPhaseVideoSrc ? (
            <video
              key={phaseVideoKey}
              src={signedPhaseVideoSrc}
              className="h-full w-full object-cover"
              autoPlay
              muted
              loop={phaseVideoLoop}
              playsInline
              onEnded={shouldAutoAdvanceOnEnd ? () => progressPhase() : undefined}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center p-8">
              <PhasePlaceholder
                title={PHASE_META[phase].title}
                subtitle={PHASE_META[phase].subtitle}
                details={details}
              />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/65" />
          <div className="pointer-events-none absolute left-6 top-6 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-[10px] uppercase tracking-[0.4em] text-white/80">
            {PHASE_META[phase].subtitle}
          </div>
          {phaseVideo?.progress ? (
            <div className="pointer-events-none absolute right-6 top-6 rounded-full border border-white/15 bg-black/40 px-4 py-1 text-[11px] font-semibold tracking-[0.2em] text-white/80">
              {phaseVideo.progress}
            </div>
          ) : null}

          {phase === 'LOSS_REVEAL' && signedLossCardImage ? (
            <div className="absolute inset-0 flex items-center justify-center">
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
        </div>

        <p className="mt-6 text-center text-sm text-white/65 whitespace-pre-line">
          {details ?? '演出を準備中...'}
        </p>
      </div>

      <div className="flex w-full items-center justify-center gap-8 pb-12">
        <RoundMetalButton label="NEXT" subLabel="次へ" onClick={handleAdvance} disabled={disableNext} />
        <RoundMetalButton label="SKIP" subLabel="スキップ" onClick={handleSkip} disabled={!canSkip} />
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
