import type { StoryPayload } from '@/lib/gacha/types';
import type { GachaResult } from '@/lib/gacha/common/types';

export type PlayResponse = {
  success: true;
  resultId: string;
  ticketBalance: number;
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

export type CardSummary = {
  id: string;
  name: string;
  rarity: string;
  starLevel: number;
  imageUrl: string;
  hasReversal: boolean;
};

export type ResultResponse = {
  success: true;
  resultId: string;
  gachaResult: GachaResult;
  card: CardSummary;
  story: StoryPayload;
};

export async function playGacha(configSlug?: string): Promise<PlayResponse> {
  const payload = configSlug ? { configSlug } : {};
  const res = await fetch('/api/gacha/play', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? 'ガチャを開始できませんでした。');
  }
  return data as PlayResponse;
}

export async function claimGachaResult(resultId: string): Promise<ResultResponse> {
  const res = await fetch('/api/gacha/result', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resultId }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? 'ガチャ結果を取得できませんでした。');
  }
  return data as ResultResponse;
}
