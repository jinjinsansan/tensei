"use client";

import Image from 'next/image';
import Link from 'next/link';

import { SERIAL_OVERLAY_TOP_CSS, shouldInsetSerialOverlay } from '@/lib/gacha/card-image-overrides';

type CardData = {
  id: string;
  cardName: string;
  imageUrl: string;
  starRating: number;
  moduleCardId?: string | null;
  serialNumber?: number | null;
  description?: string | null;
};

type Props = {
  starRating: number;
  cards: CardData[];
  loading: boolean;
  onClose: () => void;
  resultLabel?: string;
  errorMessage?: string | null;
  onRetry?: () => void;
  primaryCtaLabel?: string;
};

export function CardReveal({
  starRating,
  cards,
  loading,
  onClose,
  resultLabel = '結果',
  errorMessage,
  onRetry,
  primaryCtaLabel = 'もう一度',
}: Props) {
  const list = cards ?? [];
  const displayCount = list.length;

  let gridClass = 'grid gap-6 w-full';
  if (list.length <= 1) {
    gridClass += ' max-w-sm mx-auto';
  } else if (list.length === 2) {
    gridClass += ' grid-cols-1 sm:grid-cols-2';
  } else {
    gridClass += ' grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  }

  const renderBody = () => {
    if (loading) {
      return <p className="text-sm text-center text-white/80">カードを取得中...</p>;
    }
    if (!list.length) {
      return (
        <p className="text-sm text-center text-white/80">
          カード情報を取得できませんでした。時間をおいて再度お試しください。
        </p>
      );
    }

    return (
      <div className={gridClass}>
        {list.map((card) => {
          const displayName = card.cardName ?? 'カード';
          const displayStar = card.starRating ?? starRating;
          const starCount = Math.max(1, Math.min(displayStar, 12));
          const starIcons = '★'.repeat(starCount);
          const isLossCard = card.id === 'loss';
          const overlayCardId = card.moduleCardId ?? card.id;
          const shouldInsetSerial = shouldInsetSerialOverlay(overlayCardId);
          return (
            <div
              key={card.id}
              className="group relative flex flex-col gap-4 rounded-[28px] border border-white/12 bg-gradient-to-b from-white/10 via-white/5 to-black/60 p-4 shadow-[0_25px_55px_rgba(0,0,0,0.65)]"
            >
              <div>
                <p className="text-[0.8rem] text-amber-200">{starIcons}</p>
                <p className="font-display text-xl text-white drop-shadow-[0_6px_25px_rgba(0,0,0,0.8)]">{displayName}</p>
                {card.description ? (
                  <p className="mt-1 text-[0.75rem] text-white/70">{card.description}</p>
                ) : null}
              </div>
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[22px] border border-white/15 bg-black/40">
                {card.serialNumber ? (
                  <div
                    className={`pointer-events-none absolute right-3 z-10 ${shouldInsetSerial ? '' : 'top-3'}`}
                    style={shouldInsetSerial ? { top: SERIAL_OVERLAY_TOP_CSS } : undefined}
                  >
                    <span className="inline-flex items-center rounded-full border border-white/20 bg-[rgba(8,12,34,0.55)] px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.35em] text-white/90 backdrop-blur-[3px] shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
                      No.
                      <span className="ml-1 font-mono tracking-normal">{`${card.serialNumber}`.padStart(3, '0')}</span>
                    </span>
                  </div>
                ) : null}
                {card.imageUrl ? (
                  isLossCard ? (
                    <div className="flex h-full w-full items-center justify-center">
                      <Image
                        src={card.imageUrl}
                        alt={displayName}
                        width={260}
                        height={260}
                        className="max-h-[80%] w-auto object-contain drop-shadow-[0_18px_45px_rgba(0,0,0,0.8)]"
                        priority
                      />
                    </div>
                  ) : (
                    <Image
                      src={card.imageUrl}
                      alt={displayName}
                      fill
                      sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 320px"
                      className="object-contain"
                      priority
                    />
                  )
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-white/60">
                    画像準備中
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[140] overflow-y-auto bg-gradient-to-b from-black/90 via-zinc-950/95 to-black/90 px-4 py-8">
      <div className="relative mx-auto w-full max-w-5xl rounded-[32px] border border-white/15 bg-[rgba(10,8,18,0.95)] p-8 shadow-[0_40px_90px_rgba(0,0,0,0.85)]">
        <div className="absolute -inset-px rounded-[32px] border border-white/5" />
        <div className="relative space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-yellow-400">GACHA RESULT</p>
          <h2 className="font-display text-4xl text-white drop-shadow-[0_15px_45px_rgba(0,0,0,0.8)]">
            {resultLabel}
          </h2>
          <p className="text-sm text-white/70">
            ★{starRating} / {displayCount}枚
          </p>
        </div>

        <div className="relative mt-8 space-y-4">
          {renderBody()}
          {errorMessage ? (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-center text-xs text-red-200">
              <p>{errorMessage}</p>
              {onRetry ? (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-2 inline-flex items-center justify-center rounded-full border border-red-300/60 bg-transparent px-4 py-1 text-[11px] font-semibold tracking-[0.16em] text-red-100 hover:bg-red-500/10"
                >
                  カード情報を再取得
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="relative mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/collection"
            className="w-full rounded-full border border-white/20 bg-white/10 px-6 py-3 text-center text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg transition hover:bg-white/20 sm:w-auto"
          >
            コレクションページへ
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-gradient-to-r from-pink-500 to-yellow-400 px-6 py-3 text-sm font-bold uppercase tracking-[0.25em] text-black shadow-lg transition hover:brightness-110 sm:w-auto"
          >
            {primaryCtaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
