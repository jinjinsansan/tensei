"use client";

import { useCallback, useMemo, useState } from "react";

import { playGacha, claimGachaResult, type CardSummary } from "@/lib/api/gacha";
import type { StoryPayload, VideoSegment } from "@/lib/gacha/types";
import { VideoSequencePlayer } from "./video-sequence-player";
import { CardReveal } from "./card-reveal";

type PlayerState = "idle" | "loading" | "playing" | "revealing";

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
  const [state, setState] = useState<PlayerState>("idle");
  const [story, setStory] = useState<StoryPayload | null>(null);
  const [segments, setSegments] = useState<VideoSegment[]>([]);
  const [resultId, setResultId] = useState<string | null>(null);
  const [card, setCard] = useState<CardSummary | null>(null);
  const [ticketBalance, setTicketBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingResult, setIsFetchingResult] = useState(false);

  const canPlay = state === "idle" || (state === "revealing" && Boolean(card));

  const startPlay = useCallback(async () => {
    try {
      setError(null);
      setCard(null);
      setState("loading");
      const response = await playGacha();
      setStory(response.story);
      setSegments(flattenSegments(response.story));
      setResultId(response.resultId);
      setTicketBalance(response.ticketBalance);
      setState("playing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "通信に失敗しました。");
      setState("idle");
    }
  }, []);

  const handleSequenceComplete = useCallback(async () => {
    if (!resultId || card || isFetchingResult) return;
    setState("revealing");
    setIsFetchingResult(true);
    try {
      const response = await claimGachaResult(resultId);
      setCard(response.card);
      setStory(response.story);
    } catch (err) {
      setError(err instanceof Error ? err.message : "カード結果を取得できませんでした。");
    } finally {
      setIsFetchingResult(false);
    }
  }, [resultId, card, isFetchingResult]);

  const handleReset = useCallback(() => {
    setState("idle");
    setCard(null);
    setStory(null);
    setSegments([]);
    setResultId(null);
  }, []);

  const statusText = useMemo(() => {
    switch (state) {
      case "loading":
        return "転生準備中";
      case "playing":
        return "転生シナリオ再生中";
      case "revealing":
        return card ? "結果表示中" : "カード確認中";
      default:
        return "転生ボタンを押してスタート";
    }
  }, [state, card]);

  const playerKey = story ? `${story.cardId}-${segments.length}` : `idle-${segments.length}`;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white/5 p-4 text-center text-sm text-white/80">
        {ticketBalance !== null && (
          <p className="mb-1 text-xs text-emerald-200">チケット残り {ticketBalance}</p>
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
          className="flex-1 rounded-2xl bg-gradient-to-r from-amber-400 to-pink-500 px-6 py-4 text-base font-semibold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          onClick={startPlay}
          disabled={!canPlay}
        >
          {state === "loading" ? "準備中..." : "転生を始める"}
        </button>
        <button
          className="flex-1 rounded-2xl border border-white/30 px-6 py-4 text-base font-semibold text-white"
          onClick={handleReset}
        >
          リセット
        </button>
      </div>

      {error && <p className="text-center text-sm text-rose-300">{error}</p>}

      <CardReveal open={Boolean(card)} card={card} story={story} onClose={handleReset} />
    </div>
  );
}
