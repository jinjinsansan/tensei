"use client";

import { useState } from "react";

import type { GachaPlayEntry } from "@/lib/data/transactions";

type GachaHistoryItem = GachaPlayEntry & { formattedTimestamp: string };

const INITIAL_VISIBLE = 10;

export function GachaHistoryList({ entries }: { entries: GachaHistoryItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const visibleEntries = expanded ? entries : entries.slice(0, INITIAL_VISIBLE);

  return (
    <div className="space-y-4">
      {visibleEntries.map((play) => (
        <article
          key={play.id}
          className="rounded-3xl border border-white/10 bg-gradient-to-r from-blue-500/5 via-black/30 to-black/40 p-4 shadow-panel-inset"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">{play.formattedTimestamp}</p>
              <p className="font-display text-xl text-white">
                {play.cardName ?? "???"}
                <span className="ml-2 text-base text-white/70">★{play.starLevel}</span>
              </p>
              <p className="text-xs text-white/60">
                {play.characterName ?? "キャラクター不明"} / {play.cardRarity ?? "N"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[0.6rem] uppercase tracking-[0.4em] text-white/50">Result ID</p>
              <p className="font-mono text-sm text-white/80">{play.historyId ?? "-"}</p>
              <p className="text-xs text-white/60">
                {play.hadReversal ? "逆転演出あり" : "通常演出"} ・ {play.obtainedVia}
              </p>
            </div>
          </div>
        </article>
      ))}

      {entries.length > INITIAL_VISIBLE ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="w-full rounded-full border border-white/30 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-neon-blue/40 hover:bg-neon-blue/10"
        >
          {expanded ? "最新10件だけ表示する" : `もっと見る（+${entries.length - INITIAL_VISIBLE}件）`}
        </button>
      ) : null}
    </div>
  );
}
