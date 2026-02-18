"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { Check, ChevronDown } from "lucide-react";

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

const SECTION_CARD = "space-y-4 rounded-3xl border border-white/10 bg-black/25 p-6 shadow-panel-inset";
const FIELD_LABEL = "text-[0.6rem] uppercase tracking-[0.35em] text-white/50";
const INPUT_CLASS = "w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-neon-blue focus:outline-none";

export function SocialClient({ userId, displayName, email }: Props) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [targetUserId, setTargetUserId] = useState("");
  const [selectedFriendId, setSelectedFriendId] = useState("");
  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const cardOptions = useMemo(() => {
    const base = [{ value: "", label: "選択してください" }];
    const options = collection.map((item) => {
      const stars = item.star_level ? "★".repeat(Math.max(1, Math.min(item.star_level, 12))) + " " : "";
      const serialLabel = `#${String(item.serial_number).padStart(3, "0")}`;
      return {
        value: item.inventory_id,
        label: `${stars}${item.card_name} / ${serialLabel}`,
      };
    });
    return base.concat(options);
  }, [collection]);

  const friendOptions = useMemo(() => {
    const base = [{ value: "", label: "選択してください" }];
    const options = friends.map((friend) => ({
      value: friend.id,
      label: friend.display_name ?? friend.email ?? friend.id,
    }));
    return base.concat(options);
  }, [friends]);

  useEffect(() => {
    void refreshAll();
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

    setCollection(all);
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

  const formatTimestamp = (value: string) => {
    return new Date(value).toLocaleString("ja-JP", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(label);
      setTimeout(() => setCopiedId(null), 2000);
      setMessage(`${label}をコピーしました`);
    } catch (error) {
      console.error("Copy failed:", error);
      setMessage("コピーに失敗しました");
    }
  }

  return (
    <div className="space-y-6 text-white">
      <section className={SECTION_CARD}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-neon-purple">SOCIAL PROFILE</p>
            <p className="text-sm text-zinc-300">あなたのフレンドカード。IDを共有して仲間を招待しましょう。</p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => void refreshAll()}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-white/70 transition hover:border-white/40 hover:text-white disabled:opacity-40"
          >
            最新化
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-neon-purple/30 bg-gradient-to-br from-purple-950/40 to-transparent px-4 py-3">
            <p className={FIELD_LABEL}>
              <span className="text-neon-purple">Display</span>
            </p>
            <p className="font-display text-xl text-neon-purple">{displayName ?? "未設定"}</p>
            <p className="text-xs text-zinc-400">ニックネーム</p>
          </div>
          <div className="rounded-2xl border border-neon-blue/30 bg-gradient-to-br from-blue-950/40 to-transparent px-4 py-3">
            <p className={FIELD_LABEL}>
              <span className="text-neon-blue">Email</span>
            </p>
            <p className="text-sm text-neon-blue">{email ?? "未設定"}</p>
            <p className="text-xs text-zinc-400">連絡先</p>
          </div>
          <div className="rounded-2xl border border-neon-yellow/30 bg-gradient-to-br from-yellow-950/40 to-transparent px-4 py-3">
            <p className={FIELD_LABEL}>
              <span className="text-neon-yellow">Friend ID</span>
            </p>
            <div className="mt-1 space-y-2">
              <p className="font-mono text-xs text-white/90 break-all">
                {userId.substring(0, 8)}...{userId.substring(userId.length - 4)}
              </p>
              <button
                type="button"
                onClick={() => void copyToClipboard(userId, "フレンドID")}
                className="w-full rounded-full border border-neon-yellow/50 bg-neon-yellow/10 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-neon-yellow transition hover:bg-neon-yellow/20"
              >
                {copiedId === "フレンドID" ? "✓ コピー済み" : "📋 IDをコピー"}
              </button>
            </div>
            <p className="mt-2 text-xs text-zinc-400">このIDを共有してフレンド申請を受け付けます</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className={SECTION_CARD}>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">INVITE FRIEND</p>
            <p className="text-sm text-zinc-300">相手のフレンドIDを入力して申請します。</p>
          </div>
          <form onSubmit={handleSendRequest} className="space-y-4 text-sm">
            <label className="space-y-2">
              <span className={FIELD_LABEL}>Friend ID</span>
              <div className="flex gap-2">
                <input
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="IDを入力またはペースト"
                  className={`${INPUT_CLASS} flex-1`}
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      setTargetUserId(text.trim());
                      setMessage("IDをペーストしました");
                    } catch {
                      setMessage("ペーストに失敗しました");
                    }
                  }}
                  className="rounded-2xl border border-neon-blue/30 bg-gradient-to-br from-blue-950/40 to-transparent px-4 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-neon-blue transition hover:from-blue-950/60"
                >
                  📋
                </button>
              </div>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full border border-neon-yellow/50 bg-neon-yellow/10 px-4 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-neon-yellow/20 disabled:opacity-50"
            >
              フレンド申請を送る
            </button>
          </form>
        </div>

        <div className={SECTION_CARD}>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-neon-pink">REQUEST INBOX</p>
            <p className="text-sm text-zinc-300">届いているフレンド申請</p>
          </div>
          {requests.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-center text-sm text-white/70">
              受信中の申請はありません。
            </p>
          ) : (
            <ul className="space-y-3 text-sm">
              {requests.map((req) => (
                <li
                  key={req.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-white">
                      {req.from_display_name ?? req.from_email ?? req.from_user_id}
                    </p>
                    <p className="text-[0.65rem] uppercase tracking-[0.3em] text-white/60">
                      {formatTimestamp(req.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void handleAcceptRequest(req.id)}
                    className="rounded-full border border-white/20 px-4 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-white transition hover:border-white/40 disabled:opacity-40"
                  >
                    承認
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className={SECTION_CARD}>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-neon-purple">FRIEND LIST</p>
            <p className="text-sm text-zinc-300">交流中のフレンド一覧</p>
          </div>
          {friends.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-center text-sm text-white/70">
              まだフレンドがいません。
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {friends.map((friend) => (
                <li key={friend.id} className="rounded-2xl border border-white/15 bg-gradient-to-br from-white/5 to-transparent px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-white">
                        {friend.display_name ?? friend.email ?? friend.id}
                      </p>
                      <p className="text-[0.65rem] uppercase tracking-[0.3em] text-white/60">
                        ID: <span className="break-all text-white/70 font-mono">{friend.id.substring(0, 8)}...{friend.id.substring(friend.id.length - 4)}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copyToClipboard(friend.id, friend.display_name ?? "フレンドID")}
                      className="rounded-full border border-white/20 px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] text-white/70 transition hover:border-neon-blue/50 hover:text-neon-blue"
                    >
                      {copiedId === (friend.display_name ?? "フレンドID") ? "✓" : "📋"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={SECTION_CARD}>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-neon-green">SEND CARD</p>
            <p className="text-sm text-zinc-300">シリアル付きカードをプレゼント</p>
          </div>
          <form onSubmit={handleSendCard} className="space-y-4 text-sm">
            <SelectField label="Card" value={selectedInventoryId} onChange={setSelectedInventoryId} options={cardOptions} />
            <SelectField label="Friend" value={selectedFriendId} onChange={setSelectedFriendId} options={friendOptions} />
            <button
              type="submit"
              disabled={loading || !selectedInventoryId || !selectedFriendId}
              className="w-full rounded-full border border-white/15 bg-gradient-to-r from-[#32f0c9]/30 via-[#7bf1ff]/25 to-[#fbc2eb]/30 px-4 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.35em] text-white transition hover:border-white/40 disabled:opacity-40"
            >
              カードを送付する
            </button>
          </form>
        </div>
      </section>

      {message && (
        <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-[#7bf1ff]/20 via-transparent to-[#fbc2eb]/25 px-4 py-3 text-sm text-white">
          {message}
        </div>
      )}
    </div>
  );
}

type SelectOption = {
  value: string;
  label: string;
};

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
};

function SelectField({ label, value, onChange, options }: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const labelId = useId();

  useEffect(() => {
    function handlePointer(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  const activeLabel = options.find((option) => option.value === value)?.label ?? options[0]?.label ?? "";

  return (
    <div className="space-y-2" ref={containerRef}>
      <span id={labelId} className={FIELD_LABEL}>
        {label}
      </span>
      <div className="relative">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-left text-sm text-white transition hover:border-white/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue/60"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={labelId}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="truncate text-white/90">{activeLabel}</span>
          <ChevronDown className={`ml-3 h-4 w-4 shrink-0 text-white/60 transition ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div
            role="listbox"
            aria-labelledby={labelId}
            className="absolute left-0 right-0 z-20 mt-2 rounded-2xl border border-white/15 bg-black/90 shadow-[0_20px_45px_rgba(0,0,0,0.55)] backdrop-blur-xl"
          >
            <ul className="max-h-56 overflow-y-auto py-2 text-sm">
              {options.map((option) => {
                const selected = option.value === value;
                return (
                  <li key={option.value || "placeholder"}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`flex w-full items-center justify-between px-4 py-2 text-left transition hover:bg-white/10 ${
                        selected ? "bg-white/10 text-neon-yellow" : "text-white/85"
                      }`}
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                    >
                      <span className="truncate">{option.label}</span>
                      {selected && <Check className="h-4 w-4 text-neon-yellow" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
