'use client';

import { useCallback, useEffect, useState } from 'react';

type OverdueItem = {
  resultId: string;
  userId: string;
  createdAt: string;
  hoursAgo: number;
};

type SuspiciousUser = {
  userId: string;
  pendingCount: number;
};

type SummaryData = {
  totalPending: number;
  overdueCount: number;
  overdueItems: OverdueItem[];
  suspicious: SuspiciousUser[];
};

type ForceAwardState = Record<string, 'idle' | 'loading' | 'done' | 'error'>;

export function PendingAwardsSummary() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [forceStates, setForceStates] = useState<ForceAwardState>({});

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pending-summary');
      if (!res.ok) return;
      const json = (await res.json()) as SummaryData;
      setData(json);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  const handleForceAward = useCallback(async (resultId: string) => {
    setForceStates((prev) => ({ ...prev, [resultId]: 'loading' }));
    try {
      const res = await fetch('/api/admin/force-award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultId }),
      });
      const json = (await res.json()) as { success: boolean; message?: string };
      if (json.success) {
        setForceStates((prev) => ({ ...prev, [resultId]: 'done' }));
        // リストを更新
        void fetchSummary();
      } else {
        setForceStates((prev) => ({ ...prev, [resultId]: 'error' }));
      }
    } catch {
      setForceStates((prev) => ({ ...prev, [resultId]: 'error' }));
    }
  }, [fetchSummary]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-black/20 p-5 text-sm text-white/60">
        演出待ちデータを読み込み中...
      </div>
    );
  }

  if (!data) return null;

  const { totalPending, overdueCount, overdueItems, suspicious } = data;

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-black/20 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/60">Pending Awards</p>
          <p className="text-lg font-semibold text-white">演出待ちサマリー</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchSummary()}
          className="rounded-full border border-white/20 px-4 py-1 text-xs text-white/70 transition hover:border-white/40"
        >
          更新
        </button>
      </div>

      {/* 集計カード */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
          <p className="text-xs uppercase tracking-[0.35em] text-amber-300/70">全体の演出待ち</p>
          <p className="mt-1 text-3xl font-semibold text-amber-200">{totalPending}</p>
          <p className="text-xs text-white/50">件</p>
        </div>
        <div className={`rounded-2xl border p-4 ${overdueCount > 0 ? 'border-red-400/30 bg-red-500/10' : 'border-white/10 bg-white/5'}`}>
          <p className="text-xs uppercase tracking-[0.35em] text-red-300/70">24時間超の未付与</p>
          <p className={`mt-1 text-3xl font-semibold ${overdueCount > 0 ? 'text-red-300' : 'text-white/50'}`}>
            {overdueCount}
          </p>
          <p className="text-xs text-white/50">件</p>
        </div>
      </div>

      {/* 24h超リスト */}
      {overdueItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-red-300">24時間超の未付与リスト</p>
          <div className="max-h-56 space-y-2 overflow-y-auto">
            {overdueItems.map((item) => (
              <div
                key={item.resultId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
              >
                <div>
                  <p className="font-mono text-xs text-white/60">{item.resultId}</p>
                  <p className="text-xs text-white/50">
                    ユーザー: {item.userId} /{' '}
                    <span className="text-red-300">{item.hoursAgo}時間前</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleForceAward(item.resultId)}
                  disabled={forceStates[item.resultId] === 'loading' || forceStates[item.resultId] === 'done'}
                  className="rounded-full border border-neon-blue/40 bg-neon-blue/10 px-4 py-1 text-xs font-semibold text-neon-blue transition hover:bg-neon-blue/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {forceStates[item.resultId] === 'loading'
                    ? '処理中...'
                    : forceStates[item.resultId] === 'done'
                      ? '完了'
                      : forceStates[item.resultId] === 'error'
                        ? 'エラー'
                        : '強制付与'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 不正検知: 10件以上の演出待ちユーザー */}
      {suspicious.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-orange-300">
            要注意ユーザー（7日以内に演出待ち10件超）
          </p>
          <div className="space-y-2">
            {suspicious.map((s) => (
              <div
                key={s.userId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-orange-400/20 bg-orange-500/8 px-4 py-3"
              >
                <p className="font-mono text-xs text-white/70">{s.userId}</p>
                <span className="rounded-full border border-orange-400/30 bg-orange-500/15 px-3 py-1 text-xs font-semibold text-orange-200">
                  {s.pendingCount}件待ち
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalPending === 0 && (
        <p className="rounded-2xl border border-dashed border-white/15 px-4 py-4 text-center text-sm text-white/60">
          未付与の演出はありません。
        </p>
      )}
    </div>
  );
}
