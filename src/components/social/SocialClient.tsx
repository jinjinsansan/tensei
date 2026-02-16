"use client";

import { useEffect, useState } from "react";

type Friend = {
  id: string;
  display_name: string | null;
  email: string | null;
  created_at: string;
};

type FriendRequest = {
  id: string;
  from_user_id: string;
  from_display_name: string | null;
  from_email: string | null;
  created_at: string;
};

type CollectionItem = {
  inventory_id: string;
  card_id: string;
  serial_number: number;
  card_name: string;
  rarity: string;
  star_level: number | null;
  description: string | null;
};

type ApiCollectionItem = {
  id: string;
  card_id: string;
  serial_number: number;
  cards: {
    name: string;
    rarity: string;
    star_level: number | null;
    description: string | null;
  } | null;
};

type CollectionApiResponse = {
  collection?: ApiCollectionItem[];
  page?: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

type Props = {
  userId: string;
  displayName: string | null;
  email: string | null;
};

export function SocialClient({ userId, displayName, email }: Props) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [targetUserId, setTargetUserId] = useState("");
  const [selectedFriendId, setSelectedFriendId] = useState("");
  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void refreshAll();
    // 初期マウント時のみ全体を読み込めば十分なため、依存配列は空に固定する
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshAll() {
    await Promise.all([refreshFriends(), refreshRequests(), refreshCollection()]);
  }

  async function refreshFriends() {
    const res = await fetch("/api/social/friends/list");
    if (!res.ok) return;
    const data = await res.json();
    setFriends(data.friends ?? []);
  }

  async function refreshRequests() {
    const res = await fetch("/api/social/friends/requests");
    if (!res.ok) return;
    const data = await res.json();
    setRequests(data.requests ?? []);
  }

  async function refreshCollection() {
    const PAGE_SIZE = 200;
    let all: CollectionItem[] = [];
    let offset = 0;

    // すべての所持カードをフレンド送付候補として使えるよう、ページネーションを最後まで走査する
    // エラーが出た場合は直前の状態を維持する
    let hasMore = true;
    while (hasMore) {
      const res = await fetch(`/api/collection?limit=${PAGE_SIZE}&offset=${offset}`);
      if (!res.ok) break;
      const data: CollectionApiResponse = await res.json();
      const pageItems: CollectionItem[] = (data.collection ?? []).map((item) => ({
        inventory_id: item.id,
        card_id: item.card_id,
        serial_number: item.serial_number,
        card_name: item.cards?.name ?? "",
        rarity: item.cards?.rarity ?? "",
        star_level: item.cards?.star_level ?? null,
        description: item.cards?.description ?? null,
      }));
      all = all.concat(pageItems);

      const page = data.page;
      hasMore = Boolean(page && page.hasMore);
      if (hasMore && page) {
        offset = page.offset + page.limit;
      }
    }

    if (all.length > 0) {
      setCollection(all);
    }
  }

  async function handleSendRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!targetUserId.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/social/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: targetUserId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "フレンド申請に失敗しました");
      } else {
        setMessage("フレンド申請を送信しました");
      }
      await refreshRequests();
      await refreshFriends();
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptRequest(requestId: string) {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/social/friends/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "承認に失敗しました");
      } else {
        setMessage("フレンドになりました");
      }
      await refreshRequests();
      await refreshFriends();
    } finally {
      setLoading(false);
    }
  }

  async function handleSendCard(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFriendId || !selectedInventoryId) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/social/cards/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardInventoryId: selectedInventoryId, toUserId: selectedFriendId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "カード送付に失敗しました");
      } else {
        setMessage("カードを送付しました");
      }
      await refreshCollection();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 text-white">
      {/* あなたのIDカード: フリー/ベーシックに近い深いブルー系グラデーション */}
      <section className="rounded-3xl border border-white/12 bg-gradient-to-br from-[#0b0416] via-[#1a0a22] to-[#050006] px-5 py-5 shadow-panel-inset">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-neon-yellow">YOUR ID</p>
        <p className="mt-2 text-xs text-white/70">このIDを友だちに伝えると、フレンド申請を受け取れます。</p>
        <div className="mt-3 space-y-1 text-sm">
          <p>ニックネーム: <span className="font-medium">{displayName ?? "未設定"}</span></p>
          <p>メールアドレス: <span className="font-medium">{email ?? "未設定"}</span></p>
          <p className="break-all text-[11px] text-white/60">フレンドID: {userId}</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {/* フレンド招待: ベーシックチケットに近いアンバー系 */}
        <div className="rounded-3xl border border-white/12 bg-gradient-to-br from-[#2a1a02] via-[#3f2607] to-[#0b0502] px-5 py-5">
          <h2 className="text-base font-semibold tracking-[0.08em]">フレンドを招待</h2>
          <p className="mt-1 text-[11px] text-white/70">相手のフレンドIDを入力して申請します。</p>
          <form onSubmit={handleSendRequest} className="mt-3 space-y-3 text-sm">
            <input
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              placeholder="相手のフレンドID"
              className="w-full rounded-2xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-accent px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-hall-background disabled:opacity-60"
            >
              フレンド申請を送る
            </button>
          </form>
        </div>

        {/* 届いている申請: エピックチケットに近いローズ系 */}
        <div className="rounded-3xl border border-white/12 bg-gradient-to-br from-[#2b0014] via-[#430029] to-[#070008] px-5 py-5">
          <h2 className="text-base font-semibold tracking-[0.08em]">届いている申請</h2>
          {requests.length === 0 ? (
            <p className="mt-3 text-sm text-white/65">受信中の申請はありません。</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {requests.map((req) => (
                <li
                  key={req.id}
                  className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/40 px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-medium">{req.from_display_name ?? req.from_email ?? req.from_user_id}</div>
                    <div className="text-[11px] text-white/60">{new Date(req.created_at).toLocaleString("ja-JP")}</div>
                  </div>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void handleAcceptRequest(req.id)}
                    className="rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-hall-background disabled:opacity-60"
                  >
                    承認
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {/* フレンド一覧: プレミアムチケットに近いパープル系 */}
        <div className="rounded-3xl border border-white/12 bg-gradient-to-br from-[#1c0030] via-[#2f0150] to-[#05000a] px-5 py-5">
          <h2 className="text-base font-semibold tracking-[0.08em]">フレンド一覧</h2>
          {friends.length === 0 ? (
            <p className="mt-3 text-sm text-white/65">まだフレンドがいません。</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {friends.map((friend) => (
                <li
                  key={friend.id}
                  className="rounded-2xl border border-white/10 bg-black/40 px-3 py-2"
                >
                  <div className="text-sm font-medium">{friend.display_name ?? friend.email ?? friend.id}</div>
                  <div className="text-[11px] text-white/60">
                    フレンドID: <span className="break-all">{friend.id}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* カード送付: EXチケットに近いグリーン系 */}
        <div className="rounded-3xl border border-white/12 bg-gradient-to-br from-[#032415] via-[#064030] to-[#010b06] px-5 py-5">
          <h2 className="text-base font-semibold tracking-[0.08em]">カードを贈る</h2>
          <p className="mt-1 text-[11px] text-white/70">手元のカードを1枚選んで、フレンドにプレゼントできます。</p>
          <form onSubmit={handleSendCard} className="mt-3 space-y-3 text-sm">
            <div>
              <label className="text-[11px] text-white/65">送るカード</label>
              <select
                value={selectedInventoryId}
                onChange={(e) => setSelectedInventoryId(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-black"
              >
                <option value="">選択してください</option>
                {collection.map((item) => (
                  <option key={item.inventory_id} value={item.inventory_id}>
                    {item.star_level ? '★'.repeat(Math.max(1, Math.min(item.star_level, 12))) + ' ' : ''}
                    {item.card_name} / #{item.serial_number}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-white/65">送り先フレンド</label>
              <select
                value={selectedFriendId}
                onChange={(e) => setSelectedFriendId(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-black"
              >
                <option value="">選択してください</option>
                {friends.map((friend) => (
                  <option key={friend.id} value={friend.id}>
                    {friend.display_name ?? friend.email ?? friend.id}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading || !selectedInventoryId || !selectedFriendId}
              className="w-full rounded-full bg-accent px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-hall-background disabled:opacity-60"
            >
              カードを送付する
            </button>
          </form>
        </div>
      </section>

      {message && (
        <p className="text-sm text-accent">{message}</p>
      )}
    </div>
  );
}
