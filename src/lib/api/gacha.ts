import type { StoryPayload } from '@/lib/gacha/types';
import type { GachaResult } from '@/lib/gacha/common/types';

export type GachaPullPayload = {
  order: number;
  resultId: string | null;
  gachaResult: GachaResult;
  story: StoryPayload;
  character: {
    id: string;
    name: string;
    thumbnailUrl: string | null;
    expectationLevel: number;
  };
  card: CardSummary;
};

export type PlayResponse = {
  success: true;
  ticketBalance: number | null;
  session: {
    multiSessionId: string | null;
    totalPulls: number;
  };
  pulls: GachaPullPayload[];
};

export type CardSummary = {
  id: string;
  name: string;
  rarity: string;
  starLevel: number;
  imageUrl: string;
  hasReversal: boolean;
  serialNumber?: number | null;
};

export type ResultResponse = {
  success: true;
  resultId: string;
  gachaResult: GachaResult;
  card: CardSummary;
  story: StoryPayload;
  serialNumber: number | null;
  inventoryId: string | null;
};

function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export async function playGacha(configSlug?: string): Promise<PlayResponse> {
  const payload = configSlug ? { configSlug } : {};
  let res: Response;
  try {
    res = await fetchWithTimeout(
      '/api/gacha/play',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) },
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
    throw new Error(data.error ?? 'ガチャを開始できませんでした。');
  }
  return data as PlayResponse;
}

export async function claimGachaResult(resultId: string): Promise<ResultResponse> {
  let res: Response;
  try {
    res = await fetchWithTimeout(
      '/api/gacha/result',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resultId }) },
      30000,
    );
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('通信がタイムアウトしました。時間をおいて再度お試しください。');
    }
    throw e;
  }
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? 'ガチャ結果を取得できませんでした。');
  }
  return data as ResultResponse;
}
