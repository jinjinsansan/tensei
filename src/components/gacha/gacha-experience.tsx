"use client";

import { useCallback, useMemo, useState } from 'react';

import { playGacha, claimGachaResult, type CardSummary } from '@/lib/api/gacha';
import type { StoryPayload, VideoSegment } from '@/lib/gacha/types';
import { VideoSequencePlayer } from './video-sequence-player';
import { CardReveal } from './card-reveal';

type PlayerState = 'idle' | 'loading' | 'playing' | 'revealing';

const flattenSegments = (story: StoryPayload): VideoSegment[] => {
  const list: VideoSegment[] = [];
  list.push(...story.preStory);
  list.push(...story.chance);
  list.push(...story.mainStory);
  if (story.hadReversal) {
    list.push(...story.reversalStory);
  }
  return list;
};

export function GachaExperience() {
  const [state, setState] = useState<PlayerState>('idle');
  const [story, setStory] = useState<StoryPayload | null>(null);
  const [segments, setSegments] = useState<VideoSegment[]>([]);
  const [resultId, setResultId] = useState<string | null>(null);
  const [card, setCard] = useState<CardSummary | null>(null);
  const [ticketBalance, setTicketBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingResult, setIsFetchingResult] = useState(false);

  const canPlay = state === 'idle' || (state === 'revealing' && Boolean(card));

  const startPlay = useCallback(async () => {
    try {
      setError(null);
      setCard(null);
      setState('loading');
      const response = await playGacha();
      setStory(response.story);
      setSegments(flattenSegments(response.story));
      setResultId(response.resultId);
      setTicketBalance(response.ticketBalance);
      setState('playing');
    } catch (err) {
      setError(err instanceof Error ? err.message : '通信に失敗しました。');
      setState('idle');
    }
  }, []);

  const handleSequenceComplete = useCallback(async () => {
    if (!resultId || card || isFetchingResult) return;
    setState('revealing');
    setIsFetchingResult(true);
    try {
      const response = await claimGachaResult(resultId);
      setCard(response.card);
      setStory(response.story);
    } catch (err) {
      setError(err instanceof Error ? err.message : '物語の結果を取得できませんでした。');
    } finally {
      setIsFetchingResult(false);
    }
  }, [resultId, card, isFetchingResult]);

  const handleReset = useCallback(() => {
    setState('idle');
    setCard(null);
    setStory(null);
    setSegments([]);
    setResultId(null);
  }, []);

  const statusText = useMemo(() => {
    switch (state) {
      case 'loading':
        return '栞を差し込み中...';
      case 'playing':
        return '物語を読み込み中';
      case 'revealing':
        return card ? '結果を開きます' : '本を開いています';
      default:
        return '本を開いて来世を覗きましょう';
    }
  }, [state, card]);

  const playerKey = story ? `${story.cardId}-${segments.length}` : `idle-${segments.length}`;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-accent/25 bg-card/70 p-4 text-center text-sm text-primary">
        {ticketBalance !== null && (
          <p className="mb-1 text-xs font-semibold text-accent">栞の残り {ticketBalance}</p>
        )}
        <p>{statusText}</p>
      </div>

      <VideoSequencePlayer
        key={playerKey}
        segments={segments}
        status={state}
        onComplete={handleSequenceComplete}
        isFetchingResult={isFetchingResult}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="library-button flex-1 disabled:opacity-50"
          onClick={startPlay}
          disabled={!canPlay}
        >
          {state === 'loading' ? '準備中...' : '本を開く'}
        </button>
        <button className="library-button secondary flex-1" onClick={handleReset}>
          次の本を選ぶ
        </button>
      </div>

      {error && <p className="text-center text-sm text-accent">{error}</p>}

      <CardReveal open={Boolean(card)} card={card} story={story} onClose={handleReset} />
    </div>
  );
}
