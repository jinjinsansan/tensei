"use client";

import type { TelopType } from "@/lib/gacha/types";

const telopCopy: Record<TelopType | "default", string> = {
  neutral: "転生の物語が進行中",
  chance: "転生チャンス!",
  win: "幸運の兆し",
  lose: "次の転生へ備えよう",
  reversal: "どんでん返し発動!",
  epic: "伝説級の展開",
  default: "物語再生中",
};

type Props = {
  telopType?: TelopType | null;
  text?: string | null;
  order?: string;
};

export function TelopOverlay({ telopType, text, order }: Props) {
  const displayText = text ?? telopCopy[telopType ?? "default"];
  return (
    <div className="pointer-events-none absolute inset-x-4 top-4 flex flex-col gap-1 rounded-2xl bg-black/40 p-3 text-white backdrop-blur">
      <p className="text-xs uppercase tracking-wide text-emerald-200">{order ? `Scene ${order}` : "Tensei Story"}</p>
      <p className="text-lg font-semibold">{displayText}</p>
    </div>
  );
}
