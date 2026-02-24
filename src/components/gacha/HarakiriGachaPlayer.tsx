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
  STANDBY: { src: "/videos/harakiri/harakiri_standby.mp4", muted: true, loop: true },
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
  const [phase, setPhase] = useState<Phase>("STANDBY");
  const [ready, setReady] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);

  const allSources = useMemo(() => {
    const entries = Object.values(VIDEO_MAP).map((v) => v?.src).filter(Boolean);
    return Array.from(new Set(entries)) as string[];
  }, []);
  const { resolveAssetSrc } = useSignedAssetResolver(allSources);

  const currentVideo = useMemo(() => VIDEO_MAP[phase] ?? null, [phase]);
  const resolvedSrc = useMemo(() => resolveAssetSrc(currentVideo?.src ?? null), [currentVideo, resolveAssetSrc]);

  useEffect(() => {
    const v = videoRef.current;
    if (!currentVideo || !v) return;
    if (!resolvedSrc) {
      v.pause();
      v.removeAttribute("src");
      v.load();
      return;
    }
    v.src = resolvedSrc;
    v.loop = Boolean(currentVideo.loop);
    v.muted = Boolean(currentVideo.muted);
    v.currentTime = 0;
    const playPromise = v.play();
    if (playPromise) {
      void playPromise.catch(() => undefined);
    }
  }, [currentVideo, resolvedSrc]);

  const goNext = useCallback(() => {
    const idx = PHASE_ORDER.indexOf(phase);
    const next = PHASE_ORDER[idx + 1] ?? "RESULT";
    setReady(!VIDEO_MAP[next]);
    setPhase(next);
  }, [phase]);

  const handleSkip = useCallback(() => {
    setPhase("RESULT");
    setReady(true);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

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

  const upcomingVideos = useMemo(() => {
    const idx = PHASE_ORDER.indexOf(phase);
    return PHASE_ORDER.slice(idx + 1)
      .map((p) => resolveAssetSrc(VIDEO_MAP[p]?.src ?? null))
      .filter((src): src is string => Boolean(src));
  }, [phase, resolveAssetSrc]);

  const disableNext = !ready;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black">
      <div className="relative flex h-full w-full max-w-[430px] flex-col">
        {currentVideo && (
          <div className="relative h-full w-full overflow-hidden rounded-[30px] border border-white/10 bg-black shadow-[0_30px_100px_rgba(0,0,0,0.75)]">
            <video
              key={currentVideo.src}
              ref={videoRef}
              className="h-full w-full object-cover"
              autoPlay
              playsInline
              preload="auto"
              muted={currentVideo.muted}
              loop={currentVideo.loop}
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
