import type { GachaResult } from '@/lib/gacha/common/types';

export type BattlePullPayload = {
  order: number;
  resultId: string | null;
  gachaResult: GachaResult;
  opponentCharacterId: string;
};

export type BattlePlayResponse = {
  success: true;
  ticketBalance: number | null;
  session: {
    multiSessionId: string | null;
    totalPulls: number;
  };
  pulls: BattlePullPayload[];
};

function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export async function playBattleGacha(): Promise<BattlePlayResponse> {
  let res: Response;
  try {
    res = await fetchWithTimeout(
      '/api/battle-gacha/play',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' },
      30000,
    );
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('通信がタイムアウトしました。回線状況を確認してから再度お試しください。');
    }
    throw e;
  }
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? 'バトルガチャを開始できませんでした。');
  }
  return data as BattlePlayResponse;
}
