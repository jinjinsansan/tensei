"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { useSignedAssetResolver } from "@/lib/gacha/client-assets";
import { buildCommonAssetPath } from "@/lib/gacha/assets";


type CollectionItem = {
  id: string;
  card_id: string;
  serial_number: number | null;
  obtained_at: string | null;
  cards: {
    id: string;
    name: string;
    rarity: string;
    star_level: number | null;
    description: string | null;
    image_url: string | null;
    max_supply: number | null;
    current_supply: number | null;
    person_name: string | null;
    card_style: string | null;
    is_loss_card: boolean | null;
  } | null;
};

type ApiResponse = {
  totalOwned: number;
  distinctOwned: number;
  totalAvailable: number;
  collection: CollectionItem[];
  cards: { id: string; name: string; rarity: string; image_url: string | null }[];
  page?: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

const RARITY_LABELS: Record<string, string> = {
  N: "N",
  R: "R",
  SR: "SR",
  SSR: "SSR",
  UR: "UR",
};

const RARITY_ORDER: Record<string, number> = {
  N: 1,
  R: 2,
  SR: 3,
  SSR: 4,
  UR: 5,
};

const RARITY_BADGES: Record<string, string> = {
  N: "text-white/80 border-white/30 bg-white/5",
  R: "text-amber-200 border-amber-200/50 bg-amber-500/10",
  SR: "text-rose-200 border-rose-300/40 bg-rose-500/10",
  SSR: "text-fuchsia-200 border-fuchsia-300/40 bg-fuchsia-600/10",
  UR: "text-emerald-200 border-emerald-300/40 bg-emerald-500/10",
};

const RARITY_GRADIENTS: Record<string, string> = {
  N: "from-white/5 via-transparent to-transparent",
  R: "from-[#6b4000]/70 via-transparent to-transparent",
  SR: "from-[#68001f]/70 via-transparent to-transparent",
  SSR: "from-[#2b0057]/80 via-transparent to-transparent",
  UR: "from-[#013824]/75 via-transparent to-transparent",
};

const FALLBACK_CARD_IMAGE = "/placeholders/card-default.svg";
const LOSS_CARD_NAME = "転生失敗";
const LOSS_CARD_IMAGE = buildCommonAssetPath("loss_card.png");

type LossAwareCard = { is_loss_card?: boolean | null; name?: string | null } | null;

function isLossCardData(card: LossAwareCard): boolean {
  if (!card) return false;
  if (card.is_loss_card) return true;
  return card.name === LOSS_CARD_NAME;
}


export function CollectionList() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<"recent" | "rarity" | "name">("recent");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [personFilter, setPersonFilter] = useState("all");
  const [styleFilter, setStyleFilter] = useState("all");
  const [outcomeFilter, setOutcomeFilter] = useState<"all" | "hit" | "loss">("all");

  const mountedRef = useRef(false);

  const PAGE_SIZE = 50;

  async function fetchPage(offset: number, append: boolean) {
    const res = await fetch(`/api/collection?limit=${PAGE_SIZE}&offset=${offset}`);
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error ?? "取得に失敗しました");
    }
    const payload = json as ApiResponse;
    if (!mountedRef.current) {
      return;
    }
    setData((prev) => {
      if (!prev || !append) {
        return payload;
      }
      return {
        ...payload,
        collection: [...prev.collection, ...payload.collection],
      };
    });
  }

  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      try {
        await fetchPage(0, false);
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err.message : "取得に失敗しました");
      }
    })();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const filterOptions = useMemo(() => {
    if (!data) {
      return { persons: [], styles: [], rarities: [] };
    }
    const persons = Array.from(
      new Set(
        data.collection.map((item) => item.cards?.person_name).filter((value): value is string => Boolean(value)),
      ),
    ).sort();
    const styles = Array.from(
      new Set(
        data.collection.map((item) => item.cards?.card_style).filter((value): value is string => Boolean(value)),
      ),
    ).sort();
    const rarities = Array.from(
      new Set(
        data.collection.map((item) => item.cards?.rarity).filter((value): value is string => Boolean(value)),
      ),
    ).sort((a, b) => (RARITY_ORDER[b] ?? 0) - (RARITY_ORDER[a] ?? 0));

    return { persons, styles, rarities };
  }, [data]);

  const signableSources = useMemo(() => {
    if (!data) return [];
    return data.collection
      .map((item) => item.cards?.image_url)
      .filter((src): src is string => Boolean(src) && isSignableAsset(src));
  }, [data]);

  const { resolveAssetSrc, isSigning } = useSignedAssetResolver(signableSources);

  const filtered = useMemo(() => {
    if (!data) return [];
    const lower = keyword.toLowerCase();
    const list = data.collection.filter((item) => {
      const name = item.cards?.name?.toLowerCase() ?? "";
      const rarity = item.cards?.rarity ?? "";
      const person = item.cards?.person_name ?? "";
      const style = item.cards?.card_style ?? "";
      const loss = isLossCardData(item.cards);
      const matchesKeyword = name.includes(lower);
      const matchesRarity = rarityFilter === "all" || rarity === rarityFilter;
      const matchesPerson = personFilter === "all" || person === personFilter;
      const matchesStyle = styleFilter === "all" || style === styleFilter;
      const matchesOutcome =
        outcomeFilter === "all" || (outcomeFilter === "loss" ? loss : !loss);
      return matchesKeyword && matchesRarity && matchesPerson && matchesStyle && matchesOutcome;
    });

    if (sort === "rarity") {
      return list.sort(
        (a, b) => (RARITY_ORDER[b.cards?.rarity ?? ""] ?? 0) - (RARITY_ORDER[a.cards?.rarity ?? ""] ?? 0),
      );
    }
    if (sort === "name") {
      return list.sort((a, b) => (a.cards?.name ?? "").localeCompare(b.cards?.name ?? ""));
    }
    return list.sort((a, b) => (b.obtained_at ?? "").localeCompare(a.obtained_at ?? ""));
  }, [data, keyword, sort, rarityFilter, personFilter, styleFilter, outcomeFilter]);

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-zinc-400">ロード中...</p>;
  }

  return (
    <div className="space-y-6">
      <section className="space-y-6 rounded-3xl border border-white/10 bg-black/30 p-6 shadow-panel-inset">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-neon-purple">COLLECTION PROGRESS</p>
            <p className="text-sm text-zinc-400">獲得済みカードのステータス</p>
          </div>
          <span className="rounded-full border border-white/20 px-4 py-1 text-[0.65rem] uppercase tracking-[0.4em] text-white/60">
            SERIAL SAFE
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white">
            <p className="text-[0.6rem] uppercase tracking-[0.4em] text-white/60">Unique</p>
            <p className="font-display text-3xl">{data.distinctOwned}</p>
            <p className="text-xs text-white/70">/ {data.totalAvailable}</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white">
            <p className="text-[0.6rem] uppercase tracking-[0.4em] text-white/60">Total</p>
            <p className="font-display text-3xl">{data.totalOwned}</p>
            <p className="text-xs text-white/70">累計入手枚数</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white">
            <p className="text-[0.6rem] uppercase tracking-[0.4em] text-white/60">Visible</p>
            <p className="font-display text-3xl">{filtered.length}</p>
            <p className="text-xs text-white/70">条件一致</p>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-black/25 p-6 shadow-panel-inset">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">FILTER</p>
          <p className="text-xs text-zinc-400">条件を組み合わせてカードを検索</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-[0.6rem] uppercase tracking-[0.35em] text-zinc-400">Keyword</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-neon-blue focus:outline-none"
              placeholder="カード名を入力"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="text-[0.6rem] uppercase tracking-[0.35em] text-zinc-400">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "recent" | "rarity" | "name")}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-neon-blue focus:outline-none"
            >
              <option value="recent">最近取得順</option>
              <option value="rarity">レア度順</option>
              <option value="name">名前順</option>
            </select>
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="space-y-1">
            <span className="text-[0.6rem] uppercase tracking-[0.35em] text-zinc-400">Rarity</span>
            <select
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-neon-blue focus:outline-none"
            >
              <option value="all">すべて</option>
              {filterOptions.rarities.map((rarity) => (
                <option key={rarity} value={rarity}>
                  {RARITY_LABELS[rarity] ?? rarity}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[0.6rem] uppercase tracking-[0.35em] text-zinc-400">Character</span>
            <select
              value={personFilter}
              onChange={(e) => setPersonFilter(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-neon-blue focus:outline-none"
            >
              <option value="all">すべて</option>
              {filterOptions.persons.map((person) => (
                <option key={person} value={person}>
                  {person}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[0.6rem] uppercase tracking-[0.35em] text-zinc-400">Style</span>
            <select
              value={styleFilter}
              onChange={(e) => setStyleFilter(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-neon-blue focus:outline-none"
            >
              <option value="all">すべて</option>
              {filterOptions.styles.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[0.6rem] uppercase tracking-[0.35em] text-zinc-400">Outcome</span>
            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value as typeof outcomeFilter)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-neon-blue focus:outline-none"
            >
              <option value="all">すべて</option>
              <option value="hit">当たりのみ</option>
              <option value="loss">転生失敗のみ</option>
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setKeyword("");
                setSort("recent");
                setRarityFilter("all");
                setPersonFilter("all");
                setStyleFilter("all");
                setOutcomeFilter("all");
              }}
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-white/80 transition hover:border-white/40 hover:text-white"
            >
              条件リセット
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-black/20 p-6 shadow-panel-inset">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.4em] text-neon-purple">COLLECTION</p>
          <p className="text-xs text-zinc-400">表示中 {filtered.length} 枚</p>
        </div>
        <div className="grid gap-4">
          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-black/30 px-6 py-10 text-center text-sm text-zinc-400">
              該当するカードがありません
            </div>
          ) : (
            filtered.map((item) => {
              const card = item.cards;
              if (!card) return null;
              const starLevel = card.star_level ?? null;
              const isLossCard = isLossCardData(card);
              const starIcons = !isLossCard && starLevel ? "★".repeat(Math.max(1, Math.min(starLevel, 12))) : "";
              const serialLabel =
                item.serial_number != null ? `#${String(item.serial_number).padStart(3, "0")}` : "---";
              const rarityBadge = RARITY_BADGES[card.rarity] ?? RARITY_BADGES.N;
              const rarityGradient = RARITY_GRADIENTS[card.rarity] ?? RARITY_GRADIENTS.N;
              const obtainedAtLabel = item.obtained_at
                ? new Date(item.obtained_at).toLocaleString("ja-JP", {
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : null;

              const rawImage = card.image_url ?? (isLossCard ? LOSS_CARD_IMAGE : null);
              const shouldSign = isSignableAsset(rawImage);
              const resolvedImage = shouldSign ? resolveAssetSrc(rawImage) : rawImage;
              const isAwaitingImage = shouldSign && Boolean(rawImage) && !resolvedImage && isSigning;

              return (
                <Link
                  key={item.id}
                  href={`/collection/${item.id}`}
                  className="group relative overflow-hidden rounded-3xl border border-white/12 bg-black/40 p-4 shadow-panel-inset transition hover:border-white/40"
                >
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${rarityGradient} opacity-70`} />
                  <div className="relative z-10 flex gap-4">
                    <div className="relative h-20 w-20 flex-shrink-0">
                      {resolvedImage ? (
                        <Image
                          src={resolvedImage}
                          alt={card.name}
                          fill
                          sizes="80px"
                          unoptimized
                          onError={(event) => {
                            if (event.currentTarget.src !== FALLBACK_CARD_IMAGE) {
                              event.currentTarget.src = FALLBACK_CARD_IMAGE;
                            }
                          }}
                          className="rounded-2xl object-cover shadow-[0_15px_25px_rgba(0,0,0,0.45)]"
                        />
                      ) : rawImage ? (
                        <div className="flex h-full w-full items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-[0.6rem] text-zinc-400">
                          {isAwaitingImage ? "LOADING" : "NO IMAGE"}
                        </div>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-[0.6rem] text-zinc-400">
                          NO IMAGE
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-lg text-white">{card.name}</p>
                        <span
                          className={`rounded-full border px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] ${rarityBadge}`}
                        >
                          {RARITY_LABELS[card.rarity] ?? card.rarity}
                        </span>
                        {isLossCard && (
                          <span className="rounded-full border border-red-300/40 bg-red-500/10 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.4em] text-red-200">
                            LOSS
                          </span>
                        )}
                      </div>
                      {starIcons ? (
                        <p className="text-xs text-amber-200">{starIcons}</p>
                      ) : isLossCard ? (
                        <p className="text-xs uppercase tracking-[0.35em] text-white/70">LOSS ROUTE</p>
                      ) : null}
                      {card.description && (
                        <p className="text-sm text-white/80 line-clamp-2">{card.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-white/60">
                        <span className="rounded-full border border-white/20 px-3 py-1">{serialLabel}</span>
                        {obtainedAtLabel && <span className="rounded-full border border-white/10 px-3 py-1">{obtainedAtLabel}</span>}
                      </div>
                      {(card.person_name || card.card_style) && (
                        <p className="text-xs text-white/70">
                          {card.person_name ?? ""}
                          {card.person_name && card.card_style ? " / " : ""}
                          {card.card_style ?? ""}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
        {data.page?.hasMore && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={async () => {
                if (loadingMore) return;
                setLoadingMore(true);
                try {
                  const nextOffset = (data.page?.offset ?? 0) + (data.page?.limit ?? PAGE_SIZE);
                  await fetchPage(nextOffset, true);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "追加のカード取得に失敗しました");
                } finally {
                  setLoadingMore(false);
                }
              }}
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-gradient-to-r from-[#7bf1ff]/15 via-transparent to-[#fbc2eb]/20 px-8 py-3 text-xs font-semibold uppercase tracking-[0.4em] text-white/80 transition hover:border-white/40 hover:text-white disabled:opacity-50"
              disabled={loadingMore}
            >
              {loadingMore ? "読み込み中..." : "カードをさらに表示"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function isSignableAsset(path?: string | null): path is string {
  if (!path) return false;
  let normalized = path.trim();
  if (!normalized) return false;
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    try {
      const url = new URL(normalized);
      normalized = url.pathname;
    } catch {
      // fall back to original string
    }
  }

  normalized = normalized.replace(/^\/+/g, '');
  return normalized.startsWith('common/') || normalized.startsWith('characters/');
}
