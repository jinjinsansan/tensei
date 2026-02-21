'use client';

import { useCallback, useEffect, useState } from 'react';

type PendingPull = {
  order: number;
  resultId: string;
  createdAt: string;
  gachaResult: unknown;
  story: unknown;
  card: {
    id: string;
    name: string;
    rarity: string;
    starLevel: number | null;
    imageUrl: string | null;
    hasReversal: boolean;
  } | null;
};

type PendingResponse = {
  success: boolean;
  hasPending: boolean;
  pulls: PendingPull[];
  sessionCreatedAt: string | null;
};

type Props = {
  onResume: (pulls: PendingPull[]) => void;
  onDismiss: () => void;
};

export function PendingSessionBanner({ onResume, onDismiss }: Props) {
  const [state, setState] = useState<'loading' | 'none' | 'pending'>('loading');
  const [pulls, setPulls] = useState<PendingPull[]>([]);
  const [sessionTime, setSessionTime] = useState<string | null>(null);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/gacha/pending')
      .then((r) => r.json() as Promise<PendingResponse>)
      .then((data) => {
        if (cancelled) return;
        if (data.success && data.hasPending && data.pulls.length > 0) {
          setPulls(data.pulls);
          setSessionTime(data.sessionCreatedAt);
          setState('pending');
        } else {
          setState('none');
        }
      })
      .catch(() => {
        if (!cancelled) setState('none');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleResume = useCallback(() => {
    onResume(pulls);
  }, [onResume, pulls]);

  const handleDismiss = useCallback(async () => {
    setDismissing(true);
    // 全件クレームしてからDismiss（演出スキップと同じ処理）
    await Promise.allSettled(
      pulls.map((pull) =>
        fetch('/api/gacha/result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resultId: pull.resultId }),
        }),
      ),
    );
    setDismissing(false);
    setState('none');
    onDismiss();
  }, [pulls, onDismiss]);

  if (state !== 'pending') return null;

  const formattedTime = sessionTime
    ? new Date(sessionTime).toLocaleString('ja-JP', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-500/15 via-black/40 to-black/60 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-amber-300">
            未受取の演出があります
          </p>
          <p className="text-sm text-white/80">
            {pulls.length}件のカード演出が未完了です。
            {formattedTime && (
              <span className="ml-1 text-white/50">（{formattedTime} のガチャ）</span>
            )}
          </p>
          <p className="text-xs text-white/50">
            ※ カードの権利は既に確定しています。24時間以内に受け取らない場合は自動付与されます。
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleResume}
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 px-6 py-2 text-sm font-semibold text-slate-900 shadow-[0_0_20px_rgba(251,191,36,0.35)] transition hover:brightness-110"
        >
          演出を見て受け取る
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          disabled={dismissing}
          className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-2 text-sm font-semibold text-white/70 transition hover:border-white/40 hover:text-white disabled:opacity-50"
        >
          {dismissing ? '受け取り中...' : 'スキップして受け取る'}
        </button>
      </div>
    </div>
  );
}

export type { PendingPull };
