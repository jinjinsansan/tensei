"use client";

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

type ApiCard = {
  id: string;
  name: string;
  starLevel: number;
  rarity: string;
  imageUrl: string | null;
  characterName: string;
  owned: boolean;
};

export function CollectionGallery() {
  const [cards, setCards] = useState<ApiCard[]>([]);
  const [keyword, setKeyword] = useState('');
  const [ownedFilter, setOwnedFilter] = useState<'all' | 'owned' | 'unowned'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch('/api/collection')
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? '図鑑情報の取得に失敗しました');
        return json.cards as ApiCard[];
      })
      .then((list) => {
        if (mounted) {
          setCards(Array.isArray(list) ? list : []);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return cards.filter((card) => {
      const matchesKeyword = card.name.toLowerCase().includes(keyword.toLowerCase());
      if (ownedFilter === 'owned' && !card.owned) return false;
      if (ownedFilter === 'unowned' && card.owned) return false;
      return matchesKeyword;
    });
  }, [cards, keyword, ownedFilter]);

  if (loading) {
    return <p className="text-sm text-zinc-400">ロード中...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-white/10 bg-hall-panel/80 p-4 shadow-panel-inset">
        <p className="text-xs uppercase tracking-[0.4em] text-zinc-400">Progress</p>
        <p className="mt-2 text-sm text-zinc-300">
          所持 {cards.filter((card) => card.owned).length} / {cards.length}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          className="min-w-[200px] flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white outline-none focus:border-neon-blue"
          placeholder="カード名で検索"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <select
          value={ownedFilter}
          onChange={(e) => setOwnedFilter(e.target.value as 'all' | 'owned' | 'unowned')}
          className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
        >
          <option value="all">すべて</option>
          <option value="owned">取得済</option>
          <option value="unowned">未取得</option>
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-zinc-400">該当するカードがありません</p>
        ) : (
          filtered.map((card) => (
            <div
              key={card.id}
              className={`flex items-center gap-3 rounded-2xl border border-white/10 p-3 shadow-panel-inset transition ${
                card.owned ? 'bg-hall-panel/80 hover:border-neon-blue' : 'bg-black/30 opacity-70'
              }`}
            >
              {card.imageUrl ? (
                <Image
                  src={card.imageUrl}
                  alt={card.name}
                  width={64}
                  height={64}
                  unoptimized
                  className="h-16 w-16 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-black/30 text-[0.6rem] text-zinc-400">
                  NO IMAGE
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-display text-base text-white">{card.name}</p>
                  <span className="text-xs text-neon-yellow">{card.rarity}</span>
                </div>
                <p className="mt-1 text-xs text-zinc-400">{card.characterName}</p>
                <p className="text-[0.65rem] uppercase tracking-[0.35em] text-zinc-500">
                  {card.owned ? 'OWNED' : 'LOCKED'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
