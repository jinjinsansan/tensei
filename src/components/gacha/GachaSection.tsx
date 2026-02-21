'use client';

import { useCallback, useState, createContext, use } from 'react';

import { GachaNeonPlayer } from '@/components/gacha/gacha-neon-player';
import { PendingSessionBanner } from '@/components/gacha/PendingSessionBanner';
import type { PendingPull } from '@/components/gacha/PendingSessionBanner';

type GachaContextValue = {
  sessionActive: boolean;
  hasPending: boolean;
  pendingPullsToResume: PendingPull[] | null;
  handleResume: (pulls: PendingPull[]) => void;
  handleSessionActive: (active: boolean) => void;
  handlePendingResolved: () => void;
  handlePendingDetected: (has: boolean) => void;
};

const GachaContext = createContext<GachaContextValue | null>(null);
GachaContext.displayName = 'GachaContext';

// ページ全体を囲むProviderをServer Componentの中に置けないため、
// バナーとボタンを別々にexportしつつ状態を共有するContext構造にする。
export function GachaStateProvider({ children }: { children: React.ReactNode }) {
  const [sessionActive, setSessionActive] = useState(false);
  const [hasPending, setHasPending] = useState(false);
  const [pendingPullsToResume, setPendingPullsToResume] = useState<PendingPull[] | null>(null);

  const handleResume = useCallback((pulls: PendingPull[]) => {
    setPendingPullsToResume(pulls);
    setHasPending(false);
  }, []);

  const handleSessionActive = useCallback((active: boolean) => {
    setSessionActive(active);
    if (active) setPendingPullsToResume(null);
  }, []);

  const handlePendingResolved = useCallback(() => {
    setHasPending(false);
  }, []);

  const handlePendingDetected = useCallback((has: boolean) => {
    setHasPending(has);
  }, []);

  return (
    <GachaContext.Provider value={{ sessionActive, hasPending, pendingPullsToResume, handleResume, handleSessionActive, handlePendingResolved, handlePendingDetected }}>
      {children}
    </GachaContext.Provider>
  );
}

export function GachaPendingBanner() {
  const ctx = use(GachaContext);
  if (!ctx || ctx.sessionActive) return null;
  return (
    <PendingSessionBanner
      onResume={ctx.handleResume}
      onDismiss={ctx.handlePendingResolved}
      onPendingDetected={ctx.handlePendingDetected}
    />
  );
}

export function GachaButton() {
  const ctx = use(GachaContext);
  return (
    <GachaNeonPlayer
      playVariant="round"
      containerClassName="space-y-1 text-center w-full max-w-[150px]"
      buttonWrapperClassName="justify-center"
      onSessionActive={ctx?.handleSessionActive}
      pendingPullsToResume={ctx?.pendingPullsToResume ?? null}
      disabledByPending={ctx?.hasPending ?? false}
    />
  );
}


