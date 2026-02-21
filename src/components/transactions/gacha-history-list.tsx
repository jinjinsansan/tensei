"use client";

import Link from "next/link";
import { useState } from "react";

import type { GachaPlayEntry } from "@/lib/data/transactions";

type GachaHistoryItem = GachaPlayEntry & { formattedTimestamp: string };

const INITIAL_VISIBLE = 10;

export function GachaHistoryList({ entries }: { entries: GachaHistoryItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const visibleEntries = expanded ? entries : entries.slice(0, INITIAL_VISIBLE);
  const pendingCount = entries.filter((e) => !e.cardAwarded).length;

  return (
    <div className="space-y-4">
      {/* 演出待ちの件数アラート */}
      {pendingCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3">
          <p className="text-sm text-amber-200">
            <span className="font-semibold">{pendingCount}件</span>の演出が未受取です。カードの権利は確定しています。
          </p>
          <Link
            href="/gacha"
            className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-500/20 px-4 py-1 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/30"
          >
            ガチャページで受け取る →
          </Link>
        </div>
      )}

      {visibleEntries.map((play) => (
        <article
          key={play.id}
          className={`rounded-3xl border p-4 shadow-panel-inset ${
            play.cardAwarded
              ? "border-white/10 bg-gradient-to-r from-blue-500/5 via-black/30 to-black/40"
              : "border-amber-400/20 bg-gradient-to-r from-amber-500/8 via-black/30 to-black/40"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">{play.formattedTimestamp}</p>
                {!play.cardAwarded && (
                  <span className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-amber-200">
                    演出待ち
                  </span>
                )}
              </div>
              <p className="font-display text-xl text-white">
                {play.cardName ?? "???"}
                <span className="ml-2 text-base text-white/70">★{play.starLevel}</span>
              </p>
              <p className="text-xs text-white/60">
                {play.characterName ?? "キャラクター不明"} / {play.cardRarity ?? "N"}
              </p>
            </div>
            <div className="text-right">
              {play.cardAwarded ? (
                <>
                  <p className="text-[0.6rem] uppercase tracking-[0.4em] text-white/50">Result ID</p>
                  <p className="font-mono text-sm text-white/80">{play.historyId ?? "-"}</p>
                  <p className="text-xs text-white/60">
                    {play.hadReversal ? "逆転演出あり" : "通常演出"} ・ {play.obtainedVia}
                  </p>
                </>
              ) : (
                <Link
                  href="/gacha"
                  className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 px-4 py-1.5 text-xs font-semibold text-slate-900 transition hover:brightness-110"
                >
                  受け取る →
                </Link>
              )}
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
