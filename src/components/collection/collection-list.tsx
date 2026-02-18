"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { Check, ChevronDown } from "lucide-react";

import type { CollectionEntry, CollectionResponse } from "@/lib/collection/types";
import { useSignedAssetResolver } from "@/lib/gacha/client-assets";
import { buildCommonAssetPath } from "@/lib/gacha/assets";

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

const PAGE_SIZE = 50;

function isLossCardData(card: { is_loss_card?: boolean | null; name?: string | null } | null): boolean {
  if (!card) return false;
  if (card.is_loss_card) return true;
  return card.name === LOSS_CARD_NAME;
}

type CollectionListProps = {
  initialData?: CollectionResponse | null;
};

type DateGroup = {
  key: string;
  label: string;
  items: CollectionEntry[];
};

export function CollectionList({ initialData = null }: CollectionListProps) {
  const [data, setData] = useState<CollectionResponse | null>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<"recent" | "rarity" | "name">("recent");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [personFilter, setPersonFilter] = useState("all");
  const [styleFilter, setStyleFilter] = useState("all");
  const [outcomeFilter, setOutcomeFilter] = useState<"all" | "hit" | "loss">("all");
  const [showHistorical, setShowHistorical] = useState(false);

  const mountedRef = useRef(false);

  async function fetchPage(offset: number, append: boolean) {
    const res = await fetch(`/api/collection?limit=${PAGE_SIZE}&offset=${offset}`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error ?? "取得に失敗しました");
    }
    const payload = json as CollectionResponse;
    if (!mountedRef.current) return;
    setData((prev) => {
      if (!prev || !append || offset === 0) {
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
    if (!initialData) {
      (async () => {
        try {
          await fetchPage(0, false);
        } catch (err) {
          if (!mountedRef.current) return;
          setError(err instanceof Error ? err.message : "取得に失敗しました");
        }
      })();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [initialData]);

  const safeData = data ?? initialData;

  const filterOptions = useMemo(() => {
    if (!safeData) {
      return { persons: [] as string[], styles: [] as string[], rarities: [] as string[] };
    }
    const persons = Array.from(
      new Set(safeData.collection.map((item) => item.cards?.person_name).filter((value): value is string => Boolean(value))),
    ).sort();
    const styles = Array.from(
      new Set(safeData.collection.map((item) => item.cards?.card_style).filter((value): value is string => Boolean(value))),
    ).sort();
    const rarities = Array.from(
      new Set(safeData.collection.map((item) => item.cards?.rarity).filter((value): value is string => Boolean(value))),
    ).sort((a, b) => (RARITY_ORDER[b] ?? 0) - (RARITY_ORDER[a] ?? 0));

    return { persons, styles, rarities };
  }, [safeData]);

  const signableSources = useMemo(() => {
    if (!safeData) return [];
    return safeData.collection
      .map((item) => item.cards?.image_url)
      .filter((src): src is string => Boolean(src) && isSignableAsset(src));
  }, [safeData]);

  const { resolveAssetSrc, isSigning } = useSignedAssetResolver(signableSources);

  const filtered = useMemo(() => {
    if (!safeData) return [];
    const lower = keyword.toLowerCase();
    const list = safeData.collection.filter((item) => {
      const name = item.cards?.name?.toLowerCase() ?? "";
      const rarity = item.cards?.rarity ?? "";
      const person = item.cards?.person_name ?? "";
      const style = item.cards?.card_style ?? "";
      const loss = isLossCardData(item.cards);
      const matchesKeyword = name.includes(lower);
      const matchesRarity = rarityFilter === "all" || rarity === rarityFilter;
      const matchesPerson = personFilter === "all" || person === personFilter;
      const matchesStyle = styleFilter === "all" || style === styleFilter;
      const matchesOutcome = outcomeFilter === "all" || (outcomeFilter === "loss" ? loss : !loss);
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
  }, [safeData, keyword, sort, rarityFilter, personFilter, styleFilter, outcomeFilter]);

  const todayKey = useMemo(() => getLocalDateKey(new Date()), []);
  const { todayEntries, historicalGroups, historicalCount } = useMemo(() => {
    const todayList: CollectionEntry[] = [];
    const historyMap = new Map<string, DateGroup>();

    filtered.forEach((item) => {
      const key = getLocalDateKey(item.obtained_at);
      if (!key || key === todayKey) {
        todayList.push(item);
        return;
      }
      const existing = historyMap.get(key);
      if (existing) {
        existing.items.push(item);
      } else {
        historyMap.set(key, { key, label: formatDateLabel(key), items: [item] });
      }
    });

    const groups = Array.from(historyMap.values()).sort((a, b) => b.key.localeCompare(a.key));
    const count = groups.reduce((acc, group) => acc + group.items.length, 0);
    return { todayEntries: todayList, historicalGroups: groups, historicalCount: count };
  }, [filtered, todayKey]);

  const visibleCount = showHistorical ? filtered.length : todayEntries.length;
  const uniqueCompletionPercent = safeData && safeData.totalAvailable > 0
    ? Math.round((safeData.distinctOwned / safeData.totalAvailable) * 100)
    : 0;
  const duplicateCount = safeData ? Math.max(safeData.totalOwned - safeData.distinctOwned, 0) : 0;
  const todayCount = todayEntries.length;
  const historicalVisibleCount = Math.max(filtered.length - todayCount, 0);

  const renderCollectionCard = (item: CollectionEntry) => {
    const card = item.cards;
    if (!card) return null;
    const starLevel = card.star_level ?? null;
    const isLossCard = isLossCardData(card);
    const starIcons = !isLossCard && starLevel ? "★".repeat(Math.max(1, Math.min(starLevel, 12))) : "";
    const serialLabel = item.serial_number != null ? `#${String(item.serial_number).padStart(3, "0")}` : "---";
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
              <span className={`rounded-full border px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] ${rarityBadge}`}>
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
            {card.description && <p className="text-sm text-white/80 line-clamp-2">{card.description}</p>}
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
  };

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  if (!safeData) {
    return <p className="text-sm text-zinc-400">ロード中...</p>;
  }

  return (
    <div className="space-y-6">
      <section className="space-y-6 rounded-3xl border border-white/10 bg-black/30 p-6 shadow-panel-inset">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-neon-purple">COLLECTION SUMMARY</p>
          <h2 className="font-display text-3xl text-white">コレクションの進捗</h2>
          <p className="text-sm text-white/70">ユニーク達成率や今日獲得したカードがひと目で分かります。</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-4 text-white">
            <p className="text-[0.6rem] uppercase tracking-[0.4em] text-white/60">コンプリート率</p>
            <p className="font-display text-4xl">{uniqueCompletionPercent}%</p>
            <p className="text-xs text-white/70">ユニーク {safeData.distinctOwned} / {safeData.totalAvailable}</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-4 text-white">
            <p className="text-[0.6rem] uppercase tracking-[0.4em] text-white/60">所持カード</p>
            <p className="font-display text-4xl">{safeData.totalOwned}</p>
            <p className="text-xs text-white/70">重複 {duplicateCount} 枚を含む総数</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-4 text-white">
            <p className="text-[0.6rem] uppercase tracking-[0.4em] text-white/60">今日の入手</p>
            <p className="font-display text-4xl">{todayCount}枚</p>
            <p className="text-xs text-white/70">履歴 {historicalVisibleCount} 枚（折りたたみ）</p>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-4 text-white">
            <p className="text-[0.6rem] uppercase tracking-[0.35em] text-white/60">シリアル保護</p>
            <p className="font-semibold text-white">SERIAL SAFE</p>
            <p className="text-sm text-white/75">ダウンロード時も実際のシリアル番号は自動でマスクされます。</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-4 text-white">
            <p className="text-[0.6rem] uppercase tracking-[0.35em] text-white/60">表示モード</p>
            <p className="text-lg font-semibold text-white">
              {showHistorical ? "本日 + 履歴を表示中" : "本日のカードのみ表示中"}
            </p>
            <p className="text-sm text-white/75">
              {showHistorical
                ? `現在 ${filtered.length} 枚のカードをリストに表示しています。`
                : `履歴を展開すると過去 ${historicalCount} 枚もすぐに確認できます。`}
            </p>
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
          <FilterSelect
            label="Sort"
            value={sort}
            onChange={setSort}
            options={[
              { value: "recent", label: "最近取得順" },
              { value: "rarity", label: "レア度順" },
              { value: "name", label: "名前順" },
            ]}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <FilterSelect
            label="Rarity"
            value={rarityFilter}
            onChange={setRarityFilter}
            options={[
              { value: "all", label: "すべて" },
              ...filterOptions.rarities.map((rarity) => ({
                value: rarity,
                label: RARITY_LABELS[rarity] ?? rarity,
              })),
            ]}
          />
          <FilterSelect
            label="Character"
            value={personFilter}
            onChange={setPersonFilter}
            options={[
              { value: "all", label: "すべて" },
              ...filterOptions.persons.map((person) => ({ value: person, label: person })),
            ]}
          />
          <FilterSelect
            label="Style"
            value={styleFilter}
            onChange={setStyleFilter}
            options={[
              { value: "all", label: "すべて" },
              ...filterOptions.styles.map((style) => ({ value: style, label: style })),
            ]}
          />
          <FilterSelect
            label="Outcome"
            value={outcomeFilter}
            onChange={setOutcomeFilter}
            options={[
              { value: "all", label: "すべて" },
              { value: "hit", label: "当たりのみ" },
              { value: "loss", label: "転生失敗のみ" },
            ]}
          />
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
          <p className="text-xs text-zinc-400">
            表示中 {visibleCount} 枚{!showHistorical && historicalCount > 0 ? "（本日のカード）" : ""}
          </p>
        </div>
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-black/30 px-6 py-10 text-center text-sm text-zinc-400">
            該当するカードがありません
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4">
              {todayEntries.length === 0 ? (
                <div className="rounded-3xl border border-white/15 bg-black/30 px-6 py-10 text-center text-sm text-zinc-300">
                  本日獲得したカードはありません。
                </div>
              ) : (
                todayEntries.map(renderCollectionCard)
              )}
            </div>

            {historicalCount > 0 && (
              <div className="rounded-3xl border border-white/12 bg-black/30 p-5 shadow-panel-inset">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-neon-blue">HISTORY</p>
                    <p className="text-sm text-white/70">{historicalCount}枚の過去カード</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHistorical((prev) => !prev)}
                    className="rounded-full border border-white/20 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-white/80 transition hover:border-white/40 hover:text-white"
                  >
                    {showHistorical ? "折りたたむ" : "過去のカードを展開"}
                  </button>
                </div>

                {showHistorical && (
                  <div className="mt-4 space-y-6">
                    {historicalGroups.map((group) => (
                      <div key={group.key} className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.35em] text-white/60">{group.label}</p>
                        <div className="grid gap-4">{group.items.map(renderCollectionCard)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {safeData.page?.hasMore && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={async () => {
                if (loadingMore) return;
                setLoadingMore(true);
                try {
                  const nextOffset = (safeData.page?.offset ?? 0) + (safeData.page?.limit ?? PAGE_SIZE);
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

type FilterSelectOption<T extends string> = {
  value: T;
  label: string;
};

type FilterSelectProps<T extends string> = {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: FilterSelectOption<T>[];
};

function FilterSelect<T extends string>({ label, value, onChange, options }: FilterSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const labelId = useId();

  useEffect(() => {
    function handlePointer(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  const activeLabel = options.find((option) => option.value === value)?.label ?? options[0]?.label ?? "";

  return (
    <div className="space-y-1" ref={containerRef}>
      <span id={labelId} className="text-[0.6rem] uppercase tracking-[0.35em] text-zinc-400">
        {label}
      </span>
      <div className="relative">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-left text-sm text-white transition hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue/60"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={labelId}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="truncate text-white/90">{activeLabel}</span>
          <ChevronDown className={`ml-3 h-4 w-4 shrink-0 text-white/60 transition ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div
            role="listbox"
            aria-labelledby={labelId}
            className="absolute left-0 right-0 z-30 mt-2 rounded-2xl border border-white/15 bg-black/90 shadow-[0_20px_45px_rgba(0,0,0,0.55)] backdrop-blur-xl"
          >
            <ul className="max-h-60 overflow-y-auto py-2 text-sm text-white/90">
              {options.map((option) => {
                const selected = option.value === value;
                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`flex w-full items-center justify-between px-4 py-2 text-left transition hover:bg-white/10 ${
                        selected ? "bg-white/10 text-neon-yellow" : "text-white/80"
                      }`}
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                    >
                      <span className="truncate">{option.label}</span>
                      {selected && <Check className="h-4 w-4 text-neon-yellow" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function getLocalDateKey(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateLabel(key: string): string {
  const date = new Date(`${key}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return key;
  }
  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
}
