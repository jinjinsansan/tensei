"use client";

import { useEffect, useMemo, useRef, useState } from 'react';

import type { VideoSegment } from '@/lib/gacha/types';
import { TelopOverlay } from './telop-overlay';

type PlayerStatus = 'idle' | 'loading' | 'playing' | 'revealing';

type Props = {
  segments: VideoSegment[];
  status: PlayerStatus;
  onComplete?: () => void;
  isFetchingResult?: boolean;
};

const phaseLabelMap: Record<VideoSegment['phase'], string> = {
  pre_story: '序章',
  chance: '前兆',
  main_story: '本編',
  reversal: '隠された章',
};

export function VideoSequencePlayer({ segments, status, onComplete, isFetchingResult }: Props) {
  const [index, setIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentSegment = segments[index];

  useEffect(() => {
    if (status !== 'playing') return;
    const video = videoRef.current;
    if (!video) return;
    const playVideo = async () => {
      try {
        await video.play();
      } catch {
        video.muted = true;
        await video.play().catch(() => {});
      }
    };
    playVideo();
  }, [status, index, currentSegment]);

  const progress = useMemo(() => {
    if (!segments.length) return 0;
    return Math.round(((index + 1) / segments.length) * 100);
  }, [segments.length, index]);

  const handleEnded = () => {
    if (index < segments.length - 1) {
      setIndex((prev) => prev + 1);
    } else {
      onComplete?.();
    }
  };

  const showPlaceholder = !segments.length || status === "idle";

  return (
    <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[28px] border border-accent/20 bg-gradient-to-b from-[#111111] via-[#0D0D0D] to-[#0A0A0A] shadow-[0_25px_65px_rgba(0,0,0,0.55)]">
      {showPlaceholder ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-secondary">
          <p className="text-2xl font-bold text-primary">閲覧室シアター</p>
          <p className="text-sm">栞を差し込むと、本が光りはじめ新しい章が開きます。</p>
        </div>
      ) : (
        <video
          key={currentSegment?.id ?? `segment-${index}`}
          ref={videoRef}
          src={currentSegment?.videoUrl}
          className="h-full w-full object-cover"
          muted
          playsInline
          autoPlay
          onEnded={handleEnded}
        />
      )}

      {!showPlaceholder && currentSegment && (
        <TelopOverlay
          telopType={currentSegment.telopType}
          text={currentSegment.telopText}
          order={`${index + 1}/${segments.length}`}
        />
      )}

      {!showPlaceholder && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center justify-between text-xs font-medium text-secondary">
            <span>進行 {progress}%</span>
            <span>{currentSegment ? phaseLabelMap[currentSegment.phase] : '本編'}</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-[#F5A623] via-[#FFB83D] to-[#FFD700]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {status === 'revealing' && isFetchingResult && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-primary">
          <p className="text-base font-semibold">物語を記録中...</p>
        </div>
      )}
    </div>
  );
}
