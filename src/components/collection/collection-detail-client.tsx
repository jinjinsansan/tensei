"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useSignedAssetResolver } from "@/lib/gacha/client-assets";

type Friend = {
  id: string;
  display_name: string | null;
  email: string | null;
};

type DetailEntry = {
  id: string;
  cardId: string;
  cardName: string;
  rarity: string;
  starLevel: number | null;
  description: string | null;
  serialNumber: number | null;
  obtainedAt: string | null;
  imageUrl: string | null;
  personName: string | null;
  cardStyle: string | null;
};

type Props = {
  entry: DetailEntry;
  shareUrl: string;
};

const FALLBACK_CARD_IMAGE = "/placeholders/card-default.svg";

const RARITY_BADGES: Record<string, string> = {
  N: "text-white/80 border-white/30 bg-white/5",
  R: "text-amber-200 border-amber-200/50 bg-amber-500/10",
  SR: "text-rose-200 border-rose-300/40 bg-rose-500/10",
  SSR: "text-fuchsia-200 border-fuchsia-300/40 bg-fuchsia-600/10",
  UR: "text-emerald-200 border-emerald-300/40 bg-emerald-500/10",
  LR: "text-cyan-200 border-cyan-300/40 bg-cyan-600/10",
};

export function CollectionDetailClient({ entry, shareUrl }: Props) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState("");
  const [sendState, setSendState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [sendMessage, setSendMessage] = useState<string | null>(null);
  const [downloadState, setDownloadState] = useState<"idle" | "pending" | "error">("idle");

  const sources = useMemo(() => (entry.imageUrl ? [entry.imageUrl] : []), [entry.imageUrl]);
  const { resolveAssetSrc, isSigning } = useSignedAssetResolver(sources);
  const resolvedImage = resolveAssetSrc(entry.imageUrl) ?? entry.imageUrl ?? FALLBACK_CARD_IMAGE;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/social/friends/list");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setFriends(data.friends ?? []);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const formattedSerial = entry.serialNumber != null ? `#${String(entry.serialNumber).padStart(3, "0")}` : "---";
  const formattedObtainedAt = useMemo(() => {
    if (!entry.obtainedAt) return "---";
    try {
      return new Date(entry.obtainedAt).toLocaleString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return entry.obtainedAt;
    }
  }, [entry.obtainedAt]);

  const stars = useMemo(() => {
    if (!entry.starLevel || entry.starLevel <= 0) return null;
    const count = Math.min(12, Math.max(1, entry.starLevel));
    return "★".repeat(count);
  }, [entry.starLevel]);

  const rarityBadge = RARITY_BADGES[entry.rarity] ?? RARITY_BADGES.N;

  const shareIntentUrl = useMemo(() => {
    const text = encodeURIComponent(`「${entry.cardName}」を獲得しました！`);
    const url = encodeURIComponent(shareUrl);
    return `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=%E6%9D%A5%E4%B8%96%E3%82%AC%E3%83%81%E3%83%A3`;
  }, [entry.cardName, shareUrl]);

  const handleSendToFriend = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!selectedFriend) return;
      setSendState("loading");
      setSendMessage(null);
      try {
        const res = await fetch("/api/social/cards/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardInventoryId: entry.id, toUserId: selectedFriend }),
        });
        const data = await res.json();
        if (!res.ok) {
          setSendState("error");
          setSendMessage(data.error ?? "カード送付に失敗しました");
        } else {
          setSendState("success");
          setSendMessage("カードを送付しました");
          setSelectedFriend("");
        }
      } catch {
        setSendState("error");
        setSendMessage("カード送付に失敗しました");
      }
    },
    [entry.id, selectedFriend],
  );

  const handleDownload = useCallback(() => {
    if (!resolvedImage) return;
    setDownloadState("pending");
    try {
      const link = document.createElement("a");
      link.href = resolvedImage;
      link.download = `${entry.cardName || "card"}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setDownloadState("idle");
    } catch {
      setDownloadState("error");
    }
  }, [entry.cardName, resolvedImage]);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 rounded-3xl border border-white/10 bg-black/40 p-6 shadow-panel-inset">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.45em] text-neon-purple">CARD SHOWCASE</p>
            <h1 className="font-display text-3xl text-white">{entry.cardName}</h1>
            {entry.description && <p className="text-sm text-white/80">{entry.description}</p>}
          </div>
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-white/10 via-white/0 to-white/0 p-4 shadow-[0_25px_80px_rgba(0,0,0,0.55)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_60%)]" />
            <div className="relative aspect-[3/4] w-full">
              <Image
                src={resolvedImage}
                alt={entry.cardName}
                fill
                sizes="(max-width: 768px) 100vw, 60vw"
                className="rounded-[26px] object-cover"
                priority
                onError={(event) => {
                  if (event.currentTarget.src !== FALLBACK_CARD_IMAGE) {
                    event.currentTarget.src = FALLBACK_CARD_IMAGE;
                  }
                }}
              />
            </div>
            {isSigning && (
              <p className="mt-3 text-center text-[0.65rem] uppercase tracking-[0.35em] text-white/60">
                署名付きURLを生成中...
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/70">
            <span className={`rounded-full border px-4 py-1 ${rarityBadge}`}>{entry.rarity}</span>
            {stars && <span className="rounded-full border border-white/15 px-4 py-1 text-amber-200">{stars}</span>}
            <span className="rounded-full border border-white/15 px-4 py-1">{formattedSerial}</span>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-white/10 bg-black/35 p-6 shadow-panel-inset">
            <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">OBTAIN DATA</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.35em] text-white/60">Serial</p>
                <p className="text-2xl font-display text-white">{formattedSerial}</p>
              </div>
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.35em] text-white/60">獲得日時</p>
                <p className="text-lg text-white">{formattedObtainedAt}</p>
              </div>
            </div>
            {(entry.personName || entry.cardStyle) && (
              <div className="mt-4 flex flex-wrap gap-2 text-[0.7rem] uppercase tracking-[0.3em] text-white/70">
                {entry.personName && (
                  <span className="rounded-full border border-white/15 px-3 py-1">{entry.personName}</span>
                )}
                {entry.cardStyle && (
                  <span className="rounded-full border border-white/15 px-3 py-1">{entry.cardStyle}</span>
                )}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/35 p-6 shadow-panel-inset">
            <p className="text-xs uppercase tracking-[0.4em] text-neon-blue">SHARE</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={shareIntentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-1 items-center justify-center rounded-full border border-white/15 px-4 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.35em] text-white transition hover:border-white/40"
              >
                Xでシェア
              </a>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!resolvedImage || downloadState === "pending"}
                className="inline-flex flex-1 items-center justify-center rounded-full border border-white/15 px-4 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.35em] text-white transition hover:border-white/40 disabled:opacity-40"
              >
                {downloadState === "pending" ? "DOWNLOADING" : "ダウンロード"}
              </button>
            </div>
            {downloadState === "error" && (
              <p className="mt-2 text-xs text-red-300">ダウンロードを開始できませんでした。もう一度お試しください。</p>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/35 p-6 shadow-panel-inset">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-neon-green">FRIEND DELIVERY</p>
                <p className="text-sm text-white/80">フレンドにカードをプレゼントできます。</p>
              </div>
              <Link
                href="/social"
                className="text-[0.65rem] uppercase tracking-[0.35em] text-neon-blue underline-offset-4 hover:underline"
              >
                フレンド管理へ
              </Link>
            </div>
            {friends.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-3 text-sm text-white/70">
                送付できるフレンドがまだいません。まずはソーシャルページでフレンド登録してください。
              </p>
            ) : (
              <form onSubmit={handleSendToFriend} className="mt-4 space-y-3">
                <label className="space-y-2 text-sm text-white">
                  <span className="text-[0.6rem] uppercase tracking-[0.35em] text-white/60">Friend</span>
                  <select
                    value={selectedFriend}
                    onChange={(event) => setSelectedFriend(event.target.value)}
                    className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white focus:border-neon-blue focus:outline-none"
                  >
                    <option value="">選択してください</option>
                    {friends.map((friend) => (
                      <option key={friend.id} value={friend.id}>
                        {friend.display_name ?? friend.email ?? friend.id}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  disabled={!selectedFriend || sendState === "loading"}
                  className="w-full rounded-full border border-white/15 bg-gradient-to-r from-[#32f0c9]/30 via-[#7bf1ff]/25 to-[#fbc2eb]/30 px-4 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.35em] text-white transition hover:border-white/40 disabled:opacity-40"
                >
                  {sendState === "loading" ? "送信中..." : "フレンドに送る"}
                </button>
                {sendMessage && (
                  <p
                    className={`text-sm ${sendState === "error" ? "text-red-300" : "text-white/80"}`}
                  >
                    {sendMessage}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
