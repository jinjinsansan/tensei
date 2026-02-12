"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { VideoSegment } from "@/lib/gacha/types";
import { TelopOverlay } from "./telop-overlay";

type PlayerStatus = "idle" | "loading" | "playing" | "revealing";

type Props = {
  segments: VideoSegment[];
  status: PlayerStatus;
  onComplete?: () => void;
  isFetchingResult?: boolean;
};

export function VideoSequencePlayer({ segments, status, onComplete, isFetchingResult }: Props) {
  const [index, setIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentSegment = segments[index];

  useEffect(() => {
    if (status !== "playing") return;
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
    <div className="relative aspect-[9/16] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl">
      {showPlaceholder ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
          <p className="text-lg font-semibold text-white">転生シアター</p>
          <p className="text-sm text-slate-300">
            ガチャボタンを押して、健太の新しい人生が始まる瞬間を見届けましょう。
          </p>
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
          <div className="flex items-center justify-between text-xs text-slate-200">
            <span>進行 {progress}%</span>
            <span>{currentSegment?.phase === "reversal" ? "どんでん返し" : currentSegment?.phase === "chance" ? "チャンス" : "ストーリー"}</span>
          </div>
          <div className="mt-1 h-1 w-full rounded-full bg-white/20">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-pink-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {status === "revealing" && isFetchingResult && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white">
          <p className="text-base font-semibold">カードを確認中...</p>
        </div>
      )}
    </div>
  );
}
