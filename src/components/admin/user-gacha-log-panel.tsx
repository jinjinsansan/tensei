"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PAGE_SIZE = 20;

type InventoryRow = {
  serial_number: number | null;
};

type LogEntry = {
  id: string;
  created_at: string;
  completed_at: string | null;
  card_awarded: boolean;
  card_id: string | null;
  star_level: number;
  obtained_via: string;
  cards?: {
    card_name: string | null;
    rarity: string | null;
  } | null;
  inventory?: InventoryRow[];
  history?: {
    result: string | null;
    result_detail: string | null;
  } | null;
};

type FetchResponse = {
  data: LogEntry[];
  page: number;
  pageSize: number;
  total: number;
};

type Props = {
  userId: string;
};

type Filters = {
  cardQuery: string;
  serialNumber: string;
  dateFrom: string;
  dateTo: string;
};

function formatTimestamp(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("ja-JP", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return value;
  }
}

function resolveStatus(entry: LogEntry) {
  const status = entry.history?.result ?? (entry.card_awarded ? "success" : "pending");
  if (status === "error") {
    return { label: "エラー", className: "border-red-400/50 bg-red-500/10 text-red-200" } as const;
  }
  if (status === "success") {
    return { label: "付与済み", className: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" } as const;
  }
  return { label: "未付与", className: "border-amber-300/40 bg-amber-500/10 text-amber-200" } as const;
}

export function UserGachaLogPanel({ userId }: Props) {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    cardQuery: "",
    serialNumber: "",
    dateFrom: "",
    dateTo: "",
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [state, setState] = useState<{ loading: boolean; error: string | null; data: FetchResponse | null }>({
    loading: true,
    error: null,
    data: null,
  });
  const [forceAwardStates, setForceAwardStates] = useState<Record<string, 'idle' | 'loading' | 'done' | 'error'>>({});
  const fetchDataRef = useRef<() => void>(() => undefined);

  const totalPages = useMemo(() => {
    if (!state.data) return 1;
    return Math.max(1, Math.ceil(state.data.total / state.data.pageSize));
  }, [state.data]);

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    const params = new URLSearchParams({
      userId,
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (appliedFilters.cardQuery.trim()) {
      params.set("cardQuery", appliedFilters.cardQuery.trim());
    }
    if (appliedFilters.serialNumber.trim()) {
      params.set("serialNumber", appliedFilters.serialNumber.trim());
    }
    if (appliedFilters.dateFrom) {
      params.set("dateFrom", appliedFilters.dateFrom);
    }
    if (appliedFilters.dateTo) {
      params.set("dateTo", appliedFilters.dateTo);
    }

    try {
      const response = await fetch(`/api/admin/gacha-logs?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "ログ取得に失敗しました");
      }
      const payload = (await response.json()) as FetchResponse;
      setState({ loading: false, error: null, data: payload });
    } catch (error) {
      setState({
        loading: false,
        error: error instanceof Error ? error.message : "ログ取得に失敗しました",
        data: null,
      });
    }
  }, [appliedFilters, page, userId]);

  useEffect(() => {
    fetchDataRef.current = fetchData;
  });

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setPage(1);
      setAppliedFilters(filters);
    },
    [filters],
  );

  const handleReset = useCallback(() => {
    const next = { cardQuery: "", serialNumber: "", dateFrom: "", dateTo: "" } satisfies Filters;
    setFilters(next);
    setPage(1);
    setAppliedFilters(next);
  }, []);

  const handleForceAward = useCallback(async (resultId: string) => {
    setForceAwardStates((prev) => ({ ...prev, [resultId]: 'loading' }));
    try {
      const res = await fetch('/api/admin/force-award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultId }),
      });
      const json = (await res.json()) as { success: boolean; message?: string };
      if (json.success) {
        setForceAwardStates((prev) => ({ ...prev, [resultId]: 'done' }));
        fetchDataRef.current();
      } else {
        setForceAwardStates((prev) => ({ ...prev, [resultId]: 'error' }));
      }
    } catch {
      setForceAwardStates((prev) => ({ ...prev, [resultId]: 'error' }));
    }
  }, []);

  const entries = state.data?.data ?? [];
  const currentStart = state.data ? (state.data.page - 1) * state.data.pageSize + 1 : 0;
  const currentEnd = state.data ? currentStart + entries.length - 1 : 0;
  const total = state.data?.total ?? 0;

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/60">GACHA RESULTS</p>
          <p className="text-xs text-white/50">ユーザー別ログ検索（ページあたり {PAGE_SIZE} 件）</p>
        </div>
        <p className="text-[0.65rem] text-white/40">日付・カード名・シリアルで柔軟に検索できます</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1 text-xs text-white/70">
          カード名キーワード
          <input
            value={filters.cardQuery}
            onChange={(event) => setFilters((prev) => ({ ...prev, cardQuery: event.target.value }))}
            placeholder="例：満員電車"
            className="w-full rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none"
          />
        </label>
        <label className="space-y-1 text-xs text-white/70">
          シリアル番号
          <input
            value={filters.serialNumber}
            onChange={(event) => setFilters((prev) => ({ ...prev, serialNumber: event.target.value }))}
            placeholder="例：123"
            className="w-full rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none"
          />
        </label>
        <label className="space-y-1 text-xs text-white/70">
          開始日時
          <input
            type="datetime-local"
            value={filters.dateFrom}
            onChange={(event) => setFilters((prev) => ({ ...prev, dateFrom: event.target.value }))}
            className="w-full rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/60 focus:outline-none"
          />
        </label>
        <label className="space-y-1 text-xs text-white/70">
          終了日時
          <input
            type="datetime-local"
            value={filters.dateTo}
            onChange={(event) => setFilters((prev) => ({ ...prev, dateTo: event.target.value }))}
            className="w-full rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/60 focus:outline-none"
          />
        </label>
        <div className="md:col-span-2 lg:col-span-4 flex flex-wrap gap-2">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#7bf1ff] to-[#c084fc] px-6 py-2 text-sm font-semibold text-slate-950"
          >
            検索
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-6 py-2 text-sm font-semibold text-white"
          >
            条件リセット
          </button>
        </div>
      </form>

      {state.loading ? (
        <p className="text-sm text-white/60">読み込み中...</p>
      ) : state.error ? (
        <p className="text-sm text-red-300">{state.error}</p>
      ) : entries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/15 px-4 py-3 text-center text-sm text-white/60">
          条件に一致するログがありません。
        </p>
      ) : (
        <div className="space-y-3">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-white/80">
              <thead>
                <tr className="text-xs uppercase tracking-[0.3em] text-white/40">
                  <th className="pb-2 pr-4">日時</th>
                  <th className="pb-2 pr-4">カード</th>
                  <th className="pb-2 pr-4">レア</th>
                  <th className="pb-2 pr-4">ルート</th>
                  <th className="pb-2 pr-4">ステータス</th>
                  <th className="pb-2 pr-4">シリアル</th>
                  <th className="pb-2 pr-4">詳細</th>
                  <th className="pb-2">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {entries.map((entry) => {
                  const label = resolveStatus(entry);
                  const cardLabel = entry.cards?.card_name ?? (entry.card_id ? "不明カード" : "LOSS / 未付与");
                  const rarityLabel = entry.cards?.rarity ?? "-";
                  const routeLabel = entry.obtained_via ? entry.obtained_via.toUpperCase() : "UNKNOWN";
                  const serialLabel = entry.inventory && entry.inventory.length > 0 ? entry.inventory[0]?.serial_number ?? "—" : "—";
                  const isPending = !entry.card_awarded;
                  const forceState = forceAwardStates[entry.id] ?? 'idle';
                  return (
                    <tr key={entry.id} className="align-top">
                      <td className="py-2 pr-4 font-mono text-xs text-white/70">{formatTimestamp(entry.created_at)}</td>
                      <td className="py-2 pr-4">
                        <p className="font-semibold text-white">{cardLabel}</p>
                        {entry.star_level ? <p className="text-xs text-white/60">★{entry.star_level}</p> : null}
                        {entry.card_id && <p className="text-[0.65rem] text-white/40">ID: {entry.card_id}</p>}
                      </td>
                      <td className="py-2 pr-4 text-white/70">{rarityLabel}</td>
                      <td className="py-2 pr-4 text-white/60">{routeLabel}</td>
                      <td className="py-2 pr-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-[0.65rem] font-semibold ${label.className}`}>
                          {label.label}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-white/70">{serialLabel}</td>
                      <td className="py-2 pr-4 text-white/70">
                        {entry.history?.result_detail ? (
                          <p className="text-xs text-white/70 line-clamp-2">{entry.history.result_detail}</p>
                        ) : (
                          <p className="text-xs text-white/40">—</p>
                        )}
                      </td>
                      <td className="py-2">
                        {isPending && entry.card_id ? (
                          <button
                            type="button"
                            onClick={() => void handleForceAward(entry.id)}
                            disabled={forceState === 'loading' || forceState === 'done'}
                            className="whitespace-nowrap rounded-full border border-neon-blue/40 bg-neon-blue/10 px-3 py-1 text-[0.65rem] font-semibold text-neon-blue transition hover:bg-neon-blue/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {forceState === 'loading' ? '処理中' : forceState === 'done' ? '完了' : forceState === 'error' ? 'エラー' : '強制付与'}
                          </button>
                        ) : (
                          <p className="text-xs text-white/30">—</p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/70">
            <p>
              {total} 件中 {entries.length ? currentStart : 0} - {entries.length ? currentEnd : 0} 件を表示
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="rounded-full border border-white/20 px-4 py-1 text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                前へ
              </button>
              <span className="text-white/60">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={page >= totalPages}
                className="rounded-full border border-white/20 px-4 py-1 text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                次へ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
