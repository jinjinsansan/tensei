import type { NumbersResultType, NumbersStage, NumbersStep } from '@/lib/numbers-gacha/types';

export type NumbersPlayResponse = {
  success: true;
  resultType: NumbersResultType;
  sequence: NumbersStep[];
  finalStage: NumbersStage;
  scenarioCode: string | null;
  scenarioId: string | null;
  resultLogId: string;
  videoBasePath: string;
  expectationStars: number;
};

function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export async function startNumbersGacha(): Promise<NumbersPlayResponse> {
  let res: Response;
  try {
    res = await fetchWithTimeout('/api/numbers-gacha/play', { method: 'POST' }, 30000);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('通信がタイムアウトしました。回線状況を確認して再試行してください。');
    }
    throw e;
  }
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? 'ガチャの開始に失敗しました。');
  }
  return data as NumbersPlayResponse;
}
