"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { RoundMetalButton } from "@/components/gacha/controls/round-metal-button";
import { useSignedAssetResolver } from "@/lib/gacha/client-assets";

type Phase =
  | "STANDBY"
  | "TITLE"
  | "C10"
  | "C9"
  | "C8"
  | "C7"
  | "C6"
  | "C5"
  | "C4"
  | "C3"
  | "INSERT_SUCCESS"
  | "INSERT_FAIL"
  | "C2"
  | "C1"
  | "PUCHUN"
  | "RESULT";

type VideoDef = { src: string; loop?: boolean };

const VIDEO_MAP: Partial<Record<Phase, VideoDef>> = {
  STANDBY: { src: "/videos/harakiri/harakiri_standby.mp4", loop: true },
  TITLE: { src: "/videos/harakiri/harakiri_title_placeholder.mp4" },
  C10: { src: "/videos/harakiri/countdown_10.mp4" },
  C9: { src: "/videos/harakiri/countdown_9.mp4" },
  C8: { src: "/videos/harakiri/countdown_8.mp4" },
  C7: { src: "/videos/harakiri/countdown_7.mp4" },
  C6: { src: "/videos/harakiri/countdown_6.mp4" },
  C5: { src: "/videos/harakiri/countdown_5.mp4" },
  C4: { src: "/videos/harakiri/countdown_4.mp4" },
  C3: { src: "/videos/harakiri/countdown_3.mp4" },
  INSERT_SUCCESS: { src: "/videos/harakiri/insert_success.mp4" },
  INSERT_FAIL: { src: "/videos/harakiri/insert_fail.mp4" },
  C2: { src: "/videos/harakiri/countdown_2.mp4" },
  C1: { src: "/videos/harakiri/countdown_1.mp4" },
  PUCHUN: { src: "/videos/common/puchun/puchun.mp4" },
};

// Pattern A: success insert after C3
const PHASE_ORDER_A: Phase[] = [
  "STANDBY", "TITLE",
  "C10", "C9", "C8", "C7", "C6", "C5", "C4", "C3",
  "INSERT_SUCCESS",
  "C2", "C1",
  "PUCHUN",
  "RESULT",
];

// Pattern B: fail insert after C3
const PHASE_ORDER_B: Phase[] = [
  "STANDBY", "TITLE",
  "C10", "C9", "C8", "C7", "C6", "C5", "C4", "C3",
  "INSERT_FAIL",
  "C2", "C1",
  "PUCHUN",
  "RESULT",
];

let patternCounter = 0;

type Props = { open: boolean; onClose?: () => void };

export function HarakiriGachaPlayer({ open, onClose }: Props) {
  const target = typeof window === "undefined" ? null : document.body;
  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const nav = document.querySelector("nav") as HTMLElement | null;
    const prevNavDisplay = nav?.style.display;
    if (nav) nav.style.display = "none";
    return () => {
      document.body.style.overflow = prevOverflow;
      if (nav) nav.style.display = prevNavDisplay ?? "";
    };
  }, [open]);

  if (!open || !target) return null;
  return createPortal(<ActivePlayer onClose={onClose} />, target);
}

function ActivePlayer({ onClose }: { onClose?: () => void }) {
  const [phaseOrder] = useState<Phase[]>(() => {
    const p = patternCounter % 2 === 0 ? PHASE_ORDER_A : PHASE_ORDER_B;
    patternCounter++;
    return p;
  });

  const [phase, setPhase] = useState<Phase>("STANDBY");
  const [videoReady, setVideoReady] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  // Track the last videoKey that triggered readiness (prevents duplicate fires)
  const lastReadyKeyRef = useRef<string | null>(null);
  // Set to true when user presses NEXT — allows unmute after play() resolves
  const allowUnmuteRef = useRef(false);

  const allSources = useMemo(() => {
    const entries = Object.values(VIDEO_MAP).map((v) => v?.src).filter(Boolean);
    return Array.from(new Set(entries)) as string[];
  }, []);
  const { resolveAssetSrc } = useSignedAssetResolver(allSources);

  const currentVideo = useMemo(() => VIDEO_MAP[phase] ?? null, [phase]);
  const resolvedSrc = useMemo(() => resolveAssetSrc(currentVideo?.src ?? null), [currentVideo, resolveAssetSrc]);

  // Unique key for the current video (used to debounce ready events and as video element key)
  const videoKey = currentVideo ? `${phase}-${currentVideo.src}` : "none";

  // Mirror GachaPlayer/BattleGachaPlayer pattern exactly:
  // Start muted → play() → unmute in .then() if user has interacted
  const syncVideoPlayback = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const shouldUnmute = allowUnmuteRef.current;
    void v.play()
      .then(() => {
        if (shouldUnmute && videoRef.current) {
          videoRef.current.muted = false;
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    syncVideoPlayback();
  }, [syncVideoPlayback, resolvedSrc, videoKey]);


  // Readiness: debounced by videoKey (same pattern as GachaPlayer)
  const handleVideoReady = useCallback(() => {
    if (lastReadyKeyRef.current === videoKey) return;
    lastReadyKeyRef.current = videoKey;
    setVideoReady(true);
  }, [videoKey]);

  const handleVideoEnded = useCallback(() => {
    if (lastReadyKeyRef.current !== videoKey) {
      lastReadyKeyRef.current = videoKey;
    }
    setVideoReady(true);
  }, [videoKey]);

  const goNext = useCallback(() => {
    const idx = phaseOrder.indexOf(phase);
    const next = phaseOrder[idx + 1] ?? "RESULT";
    const hasNextVideo = Boolean(VIDEO_MAP[next]);

    // Activate media element for audio WITHIN user gesture (iOS Safari requirement)
    allowUnmuteRef.current = true;
    const v = videoRef.current;
    if (v) {
      v.muted = false;
      void v.play().catch(() => undefined);
    }

    setVideoReady(!hasNextVideo);
    setPhase(next);
  }, [phase, phaseOrder]);

  const handleSkip = useCallback(() => {
    allowUnmuteRef.current = true;
    const v = videoRef.current;
    if (v) v.pause();
    setPhase("RESULT");
    setVideoReady(true);
  }, []);

  const subLabel = useMemo(() => {
    if (phase.startsWith("C")) return phase.slice(1);
    if (phase.includes("INSERT")) return "INSERT";
    if (phase === "TITLE") return "TITLE";
    if (phase === "PUCHUN") return "PUCHUN";
    return "";
  }, [phase]);

  const upcomingVideos = useMemo(() => {
    const idx = phaseOrder.indexOf(phase);
    return phaseOrder.slice(idx + 1)
      .map((p) => resolveAssetSrc(VIDEO_MAP[p]?.src ?? null))
      .filter((src): src is string => Boolean(src));
  }, [phase, phaseOrder, resolveAssetSrc]);

  const disableNext = !videoReady;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black">
      <div className="relative flex h-full w-full max-w-[430px] flex-col">
        {currentVideo && (
          <div className="relative h-full w-full overflow-hidden rounded-[30px] border border-white/10 bg-black shadow-[0_30px_100px_rgba(0,0,0,0.75)]">
            <video
              ref={videoRef}
              key={videoKey}
              src={resolvedSrc ?? undefined}
              className="h-full w-full object-cover"
              autoPlay
              muted
              preload="auto"
              loop={Boolean(currentVideo.loop)}
              playsInline
              onCanPlayThrough={handleVideoReady}
              onLoadedData={handleVideoReady}
              onEnded={handleVideoEnded}
            />
          </div>
        )}

        {phase === "RESULT" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/90 text-white">
            <p className="text-xs uppercase tracking-[0.5em] text-red-300">VVV GACHA</p>
            <p className="text-4xl font-extrabold">RESULT</p>
            <RoundMetalButton label="CLOSE" subLabel="戻る" onClick={onClose} />
          </div>
        )}

        {phase !== "RESULT" && (
          <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-4">
            <RoundMetalButton
              label="LEFT"
              subLabel={phase === "STANDBY" ? "START" : subLabel || "◀"}
              onClick={goNext}
              disabled={disableNext}
            />
            <RoundMetalButton label="SKIP" subLabel="スキップ" onClick={handleSkip} />
            <RoundMetalButton
              label="RIGHT"
              subLabel={phase === "STANDBY" ? "START" : subLabel || "▶"}
              onClick={goNext}
              disabled={disableNext}
            />
          </div>
        )}
      </div>

      {/* Preload upcoming videos (1x1px offscreen — same方式 as other gachas) */}
      <div
        aria-hidden
        style={{ position: "fixed", top: -2, left: -2, width: 1, height: 1, opacity: 0, pointerEvents: "none", overflow: "hidden" }}
      >
        {upcomingVideos.map((src) => (
          <video key={src} src={src} preload="auto" playsInline muted />
        ))}
      </div>
    </div>
  );
}
