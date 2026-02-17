"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

type VerificationResult = {
  found: boolean;
  card?: {
    card_name: string;
    rarity: string;
    star_level: number | null;
    image_url: string | null;
    person_name: string | null;
  };
  serial_number?: number;
  obtained_at?: string;
  owner_id?: string;
  owner_display?: string;
  is_own?: boolean;
};

type CardOption = {
  id: string;
  name: string;
  person_name: string | null;
};

const RARITY_BADGES: Record<string, string> = {
  N: "text-white/80 border-white/30 bg-white/5",
  R: "text-amber-200 border-amber-200/50 bg-amber-500/10",
  SR: "text-rose-200 border-rose-300/40 bg-rose-500/10",
  SSR: "text-fuchsia-200 border-fuchsia-300/40 bg-fuchsia-600/10",
  UR: "text-emerald-200 border-emerald-300/40 bg-emerald-500/10",
  LR: "text-cyan-200 border-cyan-300/40 bg-cyan-600/10",
};

export function VerifyOwnershipClient() {
  const [cards, setCards] = useState<CardOption[]>([]);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [searchState, setSearchState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<VerificationResult | null>(null);

  // カード一覧を取得
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/collection/cards-list");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setCards(data.cards ?? []);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedCardId || !serialNumber) return;

    setSearchState("loading");
    setResult(null);

    try {
      const res = await fetch("/api/collection/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: selectedCardId,
          serialNumber: parseInt(serialNumber, 10),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSearchState("error");
        return;
      }

      setResult(data);
      setSearchState("success");
    } catch {
      setSearchState("error");
    }
  };

  const rarityBadge = result?.card?.rarity
    ? RARITY_BADGES[result.card.rarity] ?? RARITY_BADGES.N
    : RARITY_BADGES.N;

  const stars = result?.card?.star_level
    ? "★".repeat(Math.min(12, Math.max(1, result.card.star_level)))
    : null;

  const formattedObtainedAt = result?.obtained_at
    ? new Date(result.obtained_at).toLocaleString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="space-y-6">
      {/* 検索フォーム */}
      <div className="space-y-4 rounded-3xl border border-white/10 bg-black/25 p-6 shadow-panel-inset">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neon-blue text-lg font-bold text-white">
            🔍
          </div>
          <h2 className="font-display text-2xl text-white">シリアルナンバー検索</h2>
        </div>

        <p className="text-sm leading-relaxed text-zinc-300">
          カードとシリアルナンバーを入力して、実際の所有者を確認できます。
        </p>

        <form onSubmit={handleSearch} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              <span className="text-xs uppercase tracking-[0.35em] text-white/60">CARD</span>
            </label>
            <select
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:border-neon-blue focus:outline-none"
              required
            >
              <option value="">カードを選択してください</option>
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.person_name ? `${card.person_name} - ` : ""}
                  {card.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              <span className="text-xs uppercase tracking-[0.35em] text-white/60">SERIAL NUMBER</span>
            </label>
            <input
              type="number"
              min="1"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="001"
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-neon-blue focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={searchState === "loading"}
            className="w-full rounded-full border border-neon-blue bg-neon-blue/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neon-blue/20 disabled:opacity-40"
          >
            {searchState === "loading" ? "検索中..." : "検索する"}
          </button>
        </form>

        {searchState === "error" && (
          <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            検索に失敗しました。もう一度お試しください。
          </p>
        )}
      </div>

      {/* 検索結果 */}
      {searchState === "success" && result && (
        <div className="space-y-4 rounded-3xl border border-white/10 bg-black/25 p-6 shadow-panel-inset">
          {result.found ? (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-lg font-bold text-white">
                  ✓
                </div>
                <h2 className="font-display text-2xl text-white">登録カード発見</h2>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
                {/* カード画像 */}
                <div className="space-y-3">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-white/10 via-white/0 to-white/0 p-3 shadow-[0_25px_80px_rgba(0,0,0,0.55)]">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_60%)]" />
                    {result.card?.image_url && (
                      <Image
                        src={result.card.image_url}
                        alt={result.card.card_name}
                        fill
                        sizes="(max-width: 768px) 100vw, 40vw"
                        className="rounded-[26px] object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholders/card-default.svg";
                        }}
                      />
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/70">
                    <span className={`rounded-full border px-3 py-1 ${rarityBadge}`}>
                      {result.card?.rarity}
                    </span>
                    {stars && (
                      <span className="rounded-full border border-white/15 px-3 py-1 text-amber-200">
                        {stars}
                      </span>
                    )}
                  </div>
                </div>

                {/* カード情報 */}
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-neon-purple">CARD INFO</p>
                    <h3 className="mt-2 font-display text-2xl text-white">{result.card?.card_name}</h3>
                    {result.card?.person_name && (
                      <p className="mt-1 text-sm text-zinc-400">{result.card.person_name}</p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="text-xs uppercase tracking-[0.35em] text-white/60">Serial</p>
                      <p className="mt-1 font-display text-xl text-white">
                        #{String(result.serial_number).padStart(3, "0")}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="text-xs uppercase tracking-[0.35em] text-white/60">獲得日時</p>
                      <p className="mt-1 text-sm text-white">{formattedObtainedAt}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">OWNER</p>
                    {result.is_own ? (
                      <p className="mt-2 font-display text-xl text-emerald-200">
                        ✓ あなたが所有しています
                      </p>
                    ) : (
                      <div className="mt-2 space-y-1">
                        <p className="font-display text-xl text-emerald-200">登録済み所有者</p>
                        <p className="font-mono text-sm text-zinc-400">{result.owner_display}</p>
                      </div>
                    )}
                  </div>

                  {result.is_own && (
                    <Link
                      href="/collection"
                      className="block rounded-full border border-neon-purple bg-neon-purple/10 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-neon-purple/20"
                    >
                      あなたのコレクションへ →
                    </Link>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-600 text-lg font-bold text-white">
                  ✗
                </div>
                <h2 className="font-display text-2xl text-white">カードが見つかりません</h2>
              </div>

              <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-8 text-center">
                <p className="text-sm text-zinc-300">
                  指定されたカードとシリアルナンバーの組み合わせは、データベースに登録されていません。
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  シリアルナンバーとカード名を再度ご確認ください。
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* 説明セクション */}
      <div className="space-y-4 rounded-3xl border border-white/10 bg-black/25 p-6 shadow-panel-inset">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neon-yellow text-lg font-bold text-black">
            💡
          </div>
          <h2 className="font-display text-2xl text-white">この機能について</h2>
        </div>

        <div className="space-y-3 text-sm leading-relaxed text-zinc-300">
          <p>
            カード画像は誰でも保存・複製できますが、<strong className="text-white">データベースに登録された所有者だけが本物</strong>です。
          </p>
          <p>
            この検索機能を使うことで、画像を見せられたときに「本当にその人が所有しているのか」を確認できます。
          </p>
          <p className="text-xs text-zinc-500">
            ※ 所有者情報はプライバシー保護のため、IDの一部のみ表示されます。ログイン中のユーザーが所有者の場合のみ「あなたが所有しています」と表示されます。
          </p>
        </div>
      </div>
    </div>
  );
}
