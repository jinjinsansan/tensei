"use client";

import { useEffect, useMemo, useState } from 'react';

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
    return <p className="text-sm text-secondary">書架を整えております...</p>;
  }

  if (error) {
    return <p className="text-sm text-accent">{error}</p>;
  }

  const ownedCount = cards.filter((card) => card.owned).length;
  const totalCount = cards.length;

  return (
    <div className="space-y-5 text-primary">
      <div className="library-card space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">蔵書数</p>
        <p className="text-sm text-secondary">所持 {ownedCount} / {totalCount} 冊</p>
        <div className="h-2 w-full rounded-full bg-[#222222]/60">
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: totalCount ? `${(ownedCount / Math.max(totalCount, 1)) * 100}%` : '0%' }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          className="min-w-[200px] flex-1 rounded-2xl border border-accent/25 bg-card/50 px-4 py-2 text-sm text-primary placeholder:text-secondary focus:border-accent focus:outline-none"
          placeholder="物語の書名で検索"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <select
          value={ownedFilter}
          onChange={(e) => setOwnedFilter(e.target.value as 'all' | 'owned' | 'unowned')}
          className="rounded-2xl border border-accent/25 bg-card/50 px-3 py-2 text-sm text-primary"
        >
          <option value="all">すべて</option>
          <option value="owned">収蔵済</option>
          <option value="unowned">未収蔵</option>
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-secondary">該当する書物は見つかりませんでした。</p>
        ) : (
          filtered.map((card) => {
            const rarityClass = getRarityClass(card.rarity);
            return (
              <div
                key={card.id}
                className={`flex items-center gap-4 rounded-2xl border border-accent/15 bg-card/60 px-4 py-3 transition ${card.owned ? 'opacity-100' : 'opacity-60'}`}
              >
                <div className={`flex h-20 w-14 flex-col items-center justify-center rounded-xl bg-gradient-to-b ${rarityClass} text-center text-white`}>
                  <span className="text-lg font-semibold">{card.starLevel}</span>
                  <span className="text-[0.65rem] tracking-[0.2em]">★</span>
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-base font-medium">{card.name}</p>
                  <p className="text-xs text-secondary">{card.characterName}</p>
                  <p className="text-[0.65rem] font-medium uppercase tracking-[0.4em] text-secondary">
                    {card.owned ? '開架済' : '未収蔵'}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function getRarityClass(rarity: string) {
  switch (rarity) {
    case 'N':
      return 'from-[#8B7355] to-[#5a4125]';
    case 'R':
      return 'from-[#6B8E5A] to-[#31502a]';
    case 'SR':
      return 'from-[#5B7FA5] to-[#22354d]';
    case 'SSR':
      return 'from-[#C9A84C] to-[#7a5a12]';
    case 'UR':
      return 'from-[#9B59B6] to-[#44204f]';
    case 'LR':
      return 'from-[#FFD700] to-[#8a6b10]';
    default:
      return 'from-[#3f2a1b] to-[#2c1810]';
  }
}
