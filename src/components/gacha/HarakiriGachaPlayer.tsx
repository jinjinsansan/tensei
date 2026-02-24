"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { RoundMetalButton } from "@/components/gacha/controls/round-metal-button";

type Phase =
  | "STANDBY"
  | "TITLE"
  | "C8"
  | "C7"
  | "C6"
  | "C5"
  | "RESULT";

const STANDBY_VIDEO = "/videos/harakiri/harakiri_standby.mp4";
const COUNTDOWN_SRC: Record<"C8" | "C7" | "C6" | "C5", string> = {
  C8: "/videos/harakiri/countdown_8_fire.mp4",
  C7: "/videos/harakiri/countdown_7_fire.mp4",
  C6: "/videos/harakiri/countdown_6_fire.mp4",
  C5: "/videos/harakiri/countdown_5_fire.mp4",
};

const PHASE_ORDER: Phase[] = ["STANDBY", "TITLE", "C8", "C7", "C6", "C5", "RESULT"];

type Props = { open: boolean; onClose?: () => void };

export function HarakiriGachaPlayer({ open, onClose }: Props) {
  const target = typeof window === "undefined" ? null : document.body;
  if (!open || !target) return null;
  return createPortal(<ActivePlayer onClose={onClose} />, target);
}

function ActivePlayer({ onClose }: { onClose?: () => void }) {
  const [phase, setPhase] = useState<Phase>("STANDBY");
  const [ready, setReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  const currentVideo = useMemo(() => {
    if (phase === "STANDBY") {
      return { src: STANDBY_VIDEO, muted: true, loop: true } as const;
    }
    if (phase === "C8" || phase === "C7" || phase === "C6" || phase === "C5") {
      return { src: COUNTDOWN_SRC[phase], muted: false, loop: false } as const;
    }
    return null;
  }, [phase]);

  useEffect(() => {
    const v = videoRef.current;
    if (!currentVideo || !v) return;
    v.src = currentVideo.src;
    v.loop = currentVideo.loop;
    v.muted = currentVideo.muted;
    v.currentTime = 0;
    const playPromise = v.play();
    if (playPromise) {
      void playPromise.catch(() => undefined);
    }
  }, [currentVideo]);

  const canPress = ready;

  const goNext = useCallback(() => {
    const idx = PHASE_ORDER.indexOf(phase);
    const next = PHASE_ORDER[idx + 1] ?? "RESULT";
    setReady(next === "TITLE" || next === "RESULT");
    setPhase(next);
  }, [phase]);

  const handleVideoReady = useCallback(() => setReady(true), []);

  const handleVideoEnded = useCallback(() => {
    if (phase === "C5") {
      setReady(true);
      setPhase("RESULT");
    }
  }, [phase]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 px-4 py-8">
      <div className="relative w-[min(430px,100%)] max-w-[430px] aspect-[9/16] overflow-hidden rounded-[30px] border border-white/10 bg-black shadow-[0_30px_100px_rgba(0,0,0,0.75)]">
        {/* TITLE placeholder */}
        {phase === "TITLE" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
            <div className="text-center">
              <p className="text-xs tracking-[0.35em] text-white/60">VVV GACHA</p>
              <p className="mt-3 text-2xl font-bold">TITLE PLACEHOLDER</p>
              <p className="mt-1 text-sm text-white/60">(後で差し替え)</p>
            </div>
          </div>
        )}

        {/* COUNTDOWN videos with audio */}
        {currentVideo && (
          <video
            key={currentVideo.src}
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            playsInline
            preload="auto"
            muted={currentVideo.muted}
            loop={currentVideo.loop}
            onCanPlayThrough={handleVideoReady}
            onLoadedData={handleVideoReady}
            onEnded={handleVideoEnded}
          />
        )}

        {phase === "RESULT" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/90 text-white">
            <p className="text-xs uppercase tracking-[0.5em] text-red-300">VVV GACHA</p>
            <p className="text-4xl font-extrabold">RESULT</p>
            <RoundMetalButton label="CLOSE" subLabel="戻る" onClick={onClose} />
          </div>
        )}

        {phase !== "RESULT" && (
          <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center">
            <RoundMetalButton
              label={phase === "STANDBY" ? "VVV" : "NEXT"}
              subLabel={phase === "STANDBY" ? "START" : ""}
              onClick={goNext}
              disabled={!canPress}
            />
          </div>
        )}
      </div>
    </div>
  );
}
