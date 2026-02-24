"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { RoundMetalButton } from "@/components/gacha/controls/round-metal-button";

type Phase =
  | "STANDBY"
  | "TITLE"
  | "C10"
  | "C9"
  | "C8"
  | "INSERT1_SUCCESS"
  | "INSERT1_FAIL"
  | "C7"
  | "C6"
  | "C5"
  | "INSERT2_SUCCESS"
  | "INSERT2_FAIL"
  | "C4"
  | "C3"
  | "C2"
  | "C1"
  | "C0"
  | "PUCHUN"
  | "RESULT";

type VideoDef = { src: string; muted?: boolean; loop?: boolean };

const VIDEO_MAP: Partial<Record<Phase, VideoDef>> = {
  STANDBY: { src: "/videos/harakiri/harakiri_standby.mp4", muted: false, loop: true },
  C10: { src: "/videos/harakiri/countdown_10.mp4" },
  C9: { src: "/videos/harakiri/countdown_9.mp4" },
  C8: { src: "/videos/harakiri/countdown_8.mp4" },
  INSERT1_SUCCESS: { src: "/videos/harakiri/insert_success.mp4" },
  INSERT1_FAIL: { src: "/videos/harakiri/insert_fail.mp4" },
  C7: { src: "/videos/harakiri/countdown_7.mp4" },
  C6: { src: "/videos/harakiri/countdown_6.mp4" },
  C5: { src: "/videos/harakiri/countdown_5.mp4" },
  INSERT2_SUCCESS: { src: "/videos/harakiri/insert_success.mp4" },
  INSERT2_FAIL: { src: "/videos/harakiri/insert_fail.mp4" },
  C4: { src: "/videos/harakiri/countdown_4.mp4" },
  C3: { src: "/videos/harakiri/countdown_3.mp4" },
  C2: { src: "/videos/harakiri/countdown_2.mp4" },
  C1: { src: "/videos/harakiri/countdown_1.mp4" },
  C0: { src: "/videos/harakiri/countdown_0.mp4" },
  TITLE: { src: "/videos/harakiri/harakiri_title_placeholder.mp4" },
  PUCHUN: { src: "/videos/common/puchun/puchun.mp4" },
};

const PHASE_ORDER: Phase[] = [
  "STANDBY",
  "TITLE",
  "C10",
  "C9",
  "C8",
  "INSERT1_SUCCESS",
  "INSERT1_FAIL",
  "C7",
  "C6",
  "C5",
  "INSERT2_SUCCESS",
  "INSERT2_FAIL",
  "C4",
  "C3",
  "C2",
  "C1",
  "C0",
  "PUCHUN",
  "RESULT",
];

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

  const currentVideo = useMemo(() => VIDEO_MAP[phase] ?? null, [phase]);

  useEffect(() => {
    const v = videoRef.current;
    if (!currentVideo || !v) return;
    v.src = currentVideo.src;
    v.loop = Boolean(currentVideo.loop);
    v.muted = Boolean(currentVideo.muted);
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
    setReady(!VIDEO_MAP[next]);
    setPhase(next);
  }, [phase]);

  const handleVideoReady = useCallback(() => setReady(true), []);

  const handleVideoEnded = useCallback(() => {
    setReady(true);
  }, []);

  const subLabel = useMemo(() => {
    if (phase.startsWith("C")) return phase.slice(1);
    if (phase.includes("INSERT")) return "INSERT";
    if (phase === "TITLE") return "TITLE";
    if (phase === "PUCHUN") return "PUCHUN";
    return "";
  }, [phase]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 px-4 py-8">
      <div className="relative w-[min(430px,100%)] max-w-[430px] aspect-[9/16] overflow-hidden rounded-[30px] border border-white/10 bg-black shadow-[0_30px_100px_rgba(0,0,0,0.75)]">
        {/* MAIN VIDEO */}
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
              subLabel={phase === "STANDBY" ? "START" : subLabel}
              onClick={goNext}
              disabled={!canPress}
            />
          </div>
        )}
      </div>
    </div>
  );
}
