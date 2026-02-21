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
    <div className="relative overflow-hidden rounded-[28px] border border-[#f5c842]/25 bg-gradient-to-br from-[#1a1406] via-[#0e0c02] to-[#0a0900] p-[1px] shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
      {/* 内側グロー */}
      <div className="relative rounded-[27px] bg-gradient-to-br from-[#16120a] via-[#0d0b05] to-[#080700] px-6 py-6">
        {/* 背景放射グロー */}
        <div className="pointer-events-none absolute inset-0 rounded-[27px] overflow-hidden">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 h-32 w-64 rounded-full bg-[#f5c842]/12 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-24 w-40 rounded-full bg-[#f5a623]/8 blur-2xl" />
        </div>

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* 左: アイコン + テキスト */}
          <div className="flex items-start gap-4">
            {/* アイコン */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#f5c842]/30 bg-[#f5c842]/10 shadow-[0_0_20px_rgba(245,200,66,0.25)]">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#f5c842]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-[#f5c842]">
                  未受取の演出
                </p>
                <span className="inline-flex items-center rounded-full border border-[#f5c842]/30 bg-[#f5c842]/10 px-2.5 py-0.5 text-[0.6rem] font-bold text-[#f5c842]">
                  {pulls.length}件
                </span>
              </div>
              <p className="text-sm font-medium text-white/90">
                前回のガチャ演出が未完了です。
              </p>
              <p className="text-xs text-white/45">
                {formattedTime ? `${formattedTime} のガチャ ／ ` : ''}カードの権利は確定済みです
              </p>
            </div>
          </div>

          {/* 右: ボタン */}
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
            <button
              type="button"
              onClick={handleResume}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#f5c842] to-[#f5a623] px-5 py-2 text-xs font-bold tracking-[0.08em] text-[#1a1000] shadow-[0_0_24px_rgba(245,200,66,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] transition hover:brightness-110 active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              演出を見て受け取る
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              disabled={dismissing}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs font-semibold tracking-[0.05em] text-white/55 transition hover:border-white/30 hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {dismissing ? (
                <>
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white/80" />
                  受け取り中...
                </>
              ) : (
                'スキップして受け取る'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export type { PendingPull };
