"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { GachaExperience } from "@/components/gacha/gacha-experience";

type PlayVariant = "round" | "default";

type Props = {
  playLabel?: string;
  playVariant?: PlayVariant;
};

export function GachaNeonPlayer({ playLabel = "ガチャを始める", playVariant = "round" }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      document.body.style.removeProperty("overflow");
      return;
    }
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const Button = useMemo(() => {
    if (playVariant === "round") {
      return (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative h-32 w-32 rounded-full transition-transform active:scale-95"
        >
          <div className="absolute inset-0 rounded-full border-[5px] border-zinc-500 bg-black shadow-[0_0_18px_rgba(0,0,0,0.6)]" />
          <div className="absolute inset-3 rounded-full border border-zinc-600 bg-gradient-to-b from-zinc-200 via-zinc-400 to-zinc-500 shadow-[inset_0_3px_6px_rgba(255,255,255,0.85),inset_0_-3px_6px_rgba(0,0,0,0.55),0_6px_12px_rgba(0,0,0,0.6)]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
            <span className="relative z-10 text-[0.7rem] font-bold leading-tight tracking-[0.12em] text-zinc-800 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
              {playLabel}
            </span>
            <span className="relative z-10 mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-700">
              START
            </span>
          </div>
          <div className="pointer-events-none absolute inset-3 rounded-full bg-gradient-to-br from-white/50 to-transparent opacity-60" />
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full max-w-md rounded-[14px] border border-[#f1f3f5] bg-gradient-to-b from-[#fefefe] via-[#d8dce4] to-[#aab0bc] px-8 py-4 text-base font-bold tracking-[0.08em] text-[#1a2230] shadow-[0_14px_30px_rgba(0,0,0,0.28),inset_0_2px_0_rgba(255,255,255,0.85),inset_0_-3px_0_rgba(0,0,0,0.2)] transition hover:brightness-105 active:translate-y-0.5"
      >
        {playLabel}
      </button>
    );
  }, [playLabel, playVariant]);

  const overlay = open ? (
    <div className="fixed inset-0 z-[140] overflow-y-auto bg-gradient-to-b from-black/85 via-[#080113]/95 to-black/85 px-4 py-8">
      <div className="relative mx-auto w-full max-w-4xl rounded-[32px] border border-white/15 bg-[rgba(8,4,18,0.95)] p-6 shadow-[0_45px_95px_rgba(0,0,0,0.85)]">
        <div className="absolute -inset-px rounded-[32px] border border-white/5" />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-6 top-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
          aria-label="閉じる"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mt-8">
          <GachaExperience />
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {Button}
      {typeof window !== "undefined" && overlay ? createPortal(overlay, document.body) : null}
    </>
  );
}
