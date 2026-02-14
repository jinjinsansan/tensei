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
    const res = await fetch("/api/collection");
    if (!res.ok) return;
    const data = await res.json();
    const items: CollectionItem[] = (data.collection ?? []).map((item: any) => ({
      inventory_id: item.id as string,
      card_id: item.card_id as string,
      serial_number: item.serial_number as number,
      card_name: item.cards?.name ?? "",
      rarity: item.cards?.rarity ?? "",
    }));
    setCollection(items);
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
    <div className="space-y-6">
      <section className="rounded-3xl border border-accent/25 bg-card/70 p-5 shadow-library-card">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">Your ID</p>
        <p className="mt-2 text-sm text-secondary">このIDを友だちに伝えると、フレンド申請を受け取れます。</p>
        <div className="mt-3 space-y-1 text-sm">
          <p>ニックネーム: {displayName ?? "未設定"}</p>
          <p>メールアドレス: {email ?? "未設定"}</p>
          <p className="break-all text-xs text-secondary">フレンドID: {userId}</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-accent/25 bg-card/70 p-5 shadow-library-card">
          <h2 className="text-xl font-bold">フレンドを招待</h2>
          <p className="mt-1 text-xs text-secondary">相手のフレンドIDを入力して申請します。</p>
          <form onSubmit={handleSendRequest} className="mt-3 space-y-3 text-sm">
            <input
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              placeholder="相手のフレンドID"
              className="w-full rounded-2xl border border-accent/25 bg-card/60 px-3 py-2 text-primary placeholder:text-secondary"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-hall-background disabled:opacity-60"
            >
              フレンド申請を送る
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-accent/25 bg-card/70 p-5 shadow-library-card">
          <h2 className="text-xl font-bold">届いている申請</h2>
          {requests.length === 0 ? (
            <p className="mt-3 text-sm text-secondary">受信中の申請はありません。</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {requests.map((req) => (
                <li key={req.id} className="flex items-center justify-between gap-2 rounded-2xl border border-accent/15 bg-card/60 px-3 py-2">
                  <div>
                    <div className="font-medium">{req.from_display_name ?? req.from_email ?? req.from_user_id}</div>
                    <div className="text-[11px] text-secondary">{new Date(req.created_at).toLocaleString("ja-JP")}</div>
                  </div>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void handleAcceptRequest(req.id)}
                    className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-hall-background disabled:opacity-60"
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
        <div className="rounded-3xl border border-accent/25 bg-card/70 p-5 shadow-library-card">
          <h2 className="text-xl font-bold">フレンド一覧</h2>
          {friends.length === 0 ? (
            <p className="mt-3 text-sm text-secondary">まだフレンドがいません。</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {friends.map((friend) => (
                <li key={friend.id} className="rounded-2xl border border-accent/15 bg-card/60 px-3 py-2">
                  <div className="font-medium">{friend.display_name ?? friend.email ?? friend.id}</div>
                  <div className="text-[11px] text-secondary">
                    フレンドID: <span className="break-all">{friend.id}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-accent/25 bg-card/70 p-5 shadow-library-card">
          <h2 className="text-xl font-bold">カードを贈る</h2>
          <p className="mt-1 text-xs text-secondary">手元のカードを1枚選んで、フレンドにプレゼントできます。</p>
          <form onSubmit={handleSendCard} className="mt-3 space-y-3 text-sm">
            <div>
              <label className="text-xs text-secondary">送るカード</label>
              <select
                value={selectedInventoryId}
                onChange={(e) => setSelectedInventoryId(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-accent/25 bg-card/60 px-3 py-2 text-black"
              >
                <option value="">選択してください</option>
                {collection.map((item) => (
                  <option key={item.inventory_id} value={item.inventory_id}>
                    {item.card_name} / {item.rarity} / #{item.serial_number}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-secondary">送り先フレンド</label>
              <select
                value={selectedFriendId}
                onChange={(e) => setSelectedFriendId(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-accent/25 bg-card/60 px-3 py-2 text-black"
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
              className="w-full rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-hall-background disabled:opacity-60"
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
