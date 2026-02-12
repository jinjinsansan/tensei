"use client";

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import type { CardSummary } from '@/lib/api/gacha';
import type { StoryPayload } from '@/lib/gacha/types';

type Props = {
  open: boolean;
  card: CardSummary | null;
  story: StoryPayload | null;
  onClose: () => void;
};

const rarityFrame: Record<string, string> = {
  N: 'rarity-n',
  R: 'rarity-r',
  SR: 'rarity-sr',
  SSR: 'rarity-ssr',
  UR: 'rarity-ur',
  LR: 'rarity-lr',
};

export function CardReveal({ open, card, story, onClose }: Props) {
  const router = useRouter();
  if (!open || !card) return null;
  const rarityClass = rarityFrame[card.rarity] ?? 'rarity-n';
  const description = `あなたの来世は「${card.name}」の章でした。`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 py-10">
      <div className="w-full max-w-md space-y-4 rounded-[32px] border border-library-accent/30 bg-library-primary/95 p-6 text-library-text-primary shadow-library-card">
        <p className="text-center text-sm text-library-accent">✦ 物語が完結しました ✦</p>
        <div className={`library-book-frame ${rarityClass}`}>
          <div className="relative mx-auto h-72 w-48 overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-b from-[#3b2a1f] to-[#1f130c]">
            <Image src={card.imageUrl} alt={card.name} fill className="object-cover" sizes="192px" />
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="rounded-full border border-white/20 px-3 py-1 text-library-secondary">{card.rarity}</span>
            <span className="font-accent text-lg text-library-secondary">★{card.starLevel}</span>
          </div>
          {story?.hadReversal && (
            <p className="mt-3 text-center text-sm text-library-accent">隠された章が現れ、物語が書き換わりました。</p>
          )}
        </div>
        <p className="text-center text-sm text-library-text-secondary">{description}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button className="library-button secondary flex-1" onClick={() => router.push('/collection')}>
            書架を見る
          </button>
          <button className="library-button flex-1" onClick={onClose}>
            もう1冊
          </button>
        </div>
      </div>
    </div>
  );
}
