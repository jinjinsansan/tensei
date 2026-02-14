"use client";

import { useCallback, useState } from 'react';

export type LoginBonusState = {
  status: 'idle' | 'ready' | 'success' | 'claimed';
  message?: string;
  nextResetAt?: string;
  quantity: number;
  claimed: boolean;
};

const initialState: LoginBonusState = {
  status: 'ready',
  quantity: 1,
  claimed: false,
  nextResetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export function useLoginBonus() {
  const [state, setState] = useState<LoginBonusState>(initialState);
  const [claiming, setClaiming] = useState(false);

  const claim = useCallback(async () => {
    if (state.claimed) return;
    setClaiming(true);
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        status: 'success',
        claimed: true,
        message: 'フリーチケットをお届けしました',
      }));
      setClaiming(false);
    }, 600);
  }, [state.claimed]);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev }));
  }, []);

  return { state, claiming, claim, refresh } as const;
}
