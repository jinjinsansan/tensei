"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import type { CardSummary } from "@/lib/api/gacha";
import type { StoryPayload } from "@/lib/gacha/types";

type Props = {
  open: boolean;
  card: CardSummary | null;
  story: StoryPayload | null;
  onClose: () => void;
};

const rarityColors: Record<string, string> = {
  N: "from-slate-200 to-slate-400",
  R: "from-sky-200 to-sky-400",
  SR: "from-green-200 to-emerald-400",
  SSR: "from-amber-200 to-amber-500",
  UR: "from-pink-200 to-pink-500",
  LR: "from-purple-200 to-purple-500",
};

export function CardReveal({ open, card, story, onClose }: Props) {
  const router = useRouter();
  if (!open || !card) return null;
  const gradient = rarityColors[card.rarity] ?? "from-slate-200 to-slate-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 p-6 text-white shadow-2xl">
        <p className="text-center text-sm uppercase tracking-[0.3em] text-slate-300">Reincarnation Result</p>
        <h2 className="mt-2 text-center text-2xl font-bold">{card.name}</h2>
        <div className={`mt-6 rounded-3xl bg-gradient-to-br ${gradient} p-[2px]`}>
          <div className="rounded-[28px] bg-slate-950 p-6">
            <div className="relative mx-auto h-72 w-48">
              <Image src={card.imageUrl} alt={card.name} fill className="rounded-2xl object-cover" sizes="192px" />
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="rounded-full bg-white/10 px-3 py-1 uppercase tracking-wide">{card.rarity}</span>
              <span className="font-semibold">★{card.starLevel}</span>
            </div>
            {story?.hadReversal && (
              <p className="mt-3 text-center text-sm text-rose-200">どんでん返しが発動し、伝説級の転生を達成!</p>
            )}
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            className="flex-1 rounded-2xl border border-white/30 px-4 py-3 text-sm font-semibold backdrop-blur"
            onClick={onClose}
          >
            もう一度転生
          </button>
          <button
            className="flex-1 rounded-2xl bg-white/15 px-4 py-3 text-sm font-semibold text-white"
            onClick={() => router.push("/collection")}
          >
            カード図鑑へ
          </button>
        </div>
      </div>
    </div>
  );
}
