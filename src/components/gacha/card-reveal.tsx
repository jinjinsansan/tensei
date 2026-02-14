"use client";

import { useRouter } from 'next/navigation';

import type { CardSummary } from '@/lib/api/gacha';
import type { GachaResult } from '@/lib/gacha/common/types';

type Props = {
  open: boolean;
  gachaResult: GachaResult | null;
  card?: CardSummary | null;
  isClaiming?: boolean;
  error?: string | null;
  onClose: () => void;
};

export function CardReveal({ open, gachaResult, card, isClaiming, error, onClose }: Props) {
  const router = useRouter();
  if (!open || !gachaResult) return null;

  const handleViewCollection = () => {
    onClose();
    router.push('/collection');
  };

  const rarityLabel = gachaResult.rarity;
  const starLabel = gachaResult.isLoss ? '—' : `★${gachaResult.starRating}`;
  const title = gachaResult.isLoss ? '転生失敗' : gachaResult.cardName;
  const subtitle = gachaResult.isLoss
    ? '今回は転生失敗ルート。次の挑戦で未来を切り拓こう。'
    : gachaResult.cardTitle;
  const description = gachaResult.isLoss
    ? '魂の準備が整っていないようです。演出を参考にヒントを集めましょう。'
    : `あなたの来世は ${gachaResult.cardName} でした。${gachaResult.isDonden ? 'どんでん返しで未来が覆りました。' : ''}`;
  const hintLine = gachaResult.isLoss
    ? '演出で得たヒントをもとに、次の挑戦を準備しましょう。'
    : gachaResult.isDonden
      ? 'どんでん返しで転生先が書き換わりました。真の章を記録します。'
      : 'この結果は仮表示です。最終カードUIは後日アップデートされます。';

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/85 px-4 py-10">
      <div className="w-full max-w-xl space-y-6 rounded-[32px] border border-white/15 bg-gradient-to-b from-[#13131f] via-[#090812] to-[#050208] p-8 text-white shadow-[0_45px_110px_rgba(0,0,0,0.85)]">
        <div className="space-y-2 text-center">
          <p className="text-[11px] uppercase tracking-[0.6em] text-white/45">RESULT</p>
          <h3 className="font-display text-3xl tracking-[0.08em]">{title}</h3>
          <p className="text-sm text-white/70">{subtitle}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
          <p className="text-xs uppercase tracking-[0.5em] text-white/60">COMING CARD</p>
          <div className="mt-4 space-y-1 text-sm">
            <p className="text-white/80">レアリティ: {rarityLabel}</p>
            <p className="text-white/80">スター: {starLabel}</p>
            {gachaResult.isDonden && gachaResult.dondenFromCardId ? (
              <p className="text-white/60 text-xs">
                どんでん返し: {gachaResult.dondenFromCardId} → {gachaResult.cardId}
              </p>
            ) : null}
          </div>
          <p className="mt-4 text-sm text-white/75">{description}</p>
          <div className="mt-4 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-xs text-white/60">
            {hintLine}
          </div>
        </div>

        {card ? (
          <p className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-center text-xs tracking-[0.2em] text-white/60">
            {card.name} をコレクションに保存しました
          </p>
        ) : null}

        {isClaiming ? <p className="text-center text-sm text-white/60">カード登録中...</p> : null}
        {error ? <p className="text-center text-sm text-red-400">{error}</p> : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleViewCollection}
            className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold tracking-[0.2em] text-white transition hover:bg-white/20"
          >
            コレクションを見る
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-gradient-to-r from-[#fcd34d]/30 to-[#f97316]/30 px-6 py-3 text-sm font-semibold tracking-[0.2em] text-white transition hover:brightness-110"
          >
            もう一度ガチャ
          </button>
        </div>
      </div>
    </div>
  );
}
