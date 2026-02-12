"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type CollectionCard = {
  id: string;
  name: string;
  starLevel: number;
  rarity: string;
  imageUrl: string;
  hasReversal: boolean;
  characterName: string;
  owned: boolean;
};

export function CollectionGrid() {
  const [cards, setCards] = useState<CollectionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/collection");
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error ?? "図鑑を取得できませんでした。");
        }
        if (mounted) {
          setCards(data.cards as CollectionCard[]);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "通信エラーが発生しました。");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <p className="text-center text-sm text-slate-300">図鑑を読み込んでいます...</p>;
  }

  if (error) {
    return <p className="text-center text-sm text-rose-300">{error}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.id}
          className={`rounded-3xl border p-3 backdrop-blur transition ${
            card.owned ? "border-emerald-300 bg-white/10" : "border-white/10 bg-white/5"
          }`}
        >
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-slate-900">
            <Image
              src={card.imageUrl}
              alt={card.name}
              fill
              sizes="200px"
              className={`object-cover ${card.owned ? "" : "opacity-60"}`}
            />
          </div>
          <div className="mt-3 flex flex-col gap-1 text-white">
            <p className="text-xs uppercase tracking-wide text-slate-300">{card.characterName}</p>
            <p className="text-sm font-semibold leading-tight">{card.name}</p>
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>★{card.starLevel}</span>
              <span>{card.rarity}</span>
            </div>
            {card.owned ? (
              <span className="mt-1 rounded-full bg-emerald-400/20 px-2 py-1 text-center text-[11px] text-emerald-200">
                所持中
              </span>
            ) : (
              <span className="mt-1 rounded-full bg-white/10 px-2 py-1 text-center text-[11px] text-white/60">未入手</span>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
