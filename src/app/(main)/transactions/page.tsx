import type { ReactNode } from "react";

import Link from "next/link";
import { notFound } from "next/navigation";

import { GachaHistoryList } from "@/components/transactions/gacha-history-list";
import { fetchAuthedContext } from "@/lib/app/session";
import { fetchTransactionHistory } from "@/lib/data/transactions";
import { getServiceSupabase } from "@/lib/supabase/service";

const yenFormatter = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" });

export default async function TransactionsPage() {
  const supabase = getServiceSupabase();
  const context = await fetchAuthedContext(supabase);
  if (!context) {
    notFound();
  }

  const history = await fetchTransactionHistory(supabase, context.user.id, { limit: 50 });
  const totalPurchasesYen = history.ticketPurchases
    .filter((purchase) => purchase.currency === "JPY")
    .reduce((sum, purchase) => sum + purchase.amountCents, 0);

  const gachaEntries = history.gachaPlays.map((play) => ({
    ...play,
    formattedTimestamp: formatDateTime(play.createdAt),
  }));

  const summaryCards = [
    {
      label: "購入件数",
      value: `${history.ticketPurchases.length}件`,
      helper: yenFormatter.format(totalPurchasesYen / 100),
      icon: "🎫",
      accent: "from-yellow-500/15 via-yellow-500/5 to-black/40 border-yellow-400/30",
    },
    {
      label: "ガチャ履歴",
      value: `${history.gachaPlays.length}件`,
      helper: "最新50件",
      icon: "🎰",
      accent: "from-blue-500/20 via-blue-500/5 to-black/40 border-blue-400/30",
    },
    {
      label: "カード送受信",
      value: `${history.cardTransfers.length}件`,
      helper: "フレンド配送",
      icon: "🔁",
      accent: "from-pink-500/20 via-pink-500/5 to-black/40 border-pink-400/30",
    },
  ];

  return (
    <section className="relative mx-auto w-full max-w-5xl space-y-8 pb-14">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-neon-purple/20 blur-3xl" />
        <div className="absolute right-0 top-20 h-56 w-56 rounded-full bg-neon-blue/10 blur-[100px]" />
        <div className="absolute bottom-0 left-8 h-56 w-56 rounded-full bg-neon-pink/10 blur-[100px]" />
      </div>

      <header className="space-y-4 rounded-3xl border border-white/10 bg-black/30 px-6 py-8 text-center shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-yellow">Transaction History</p>
        <h1 className="font-display text-4xl text-white">取引履歴</h1>
        <p className="text-sm text-zinc-300">
          チケット購入・ガチャ結果・カード送受信の履歴をまとめて確認できます。安心して遊べるよう、必要な情報をいつでも参照できます。
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </div>

      <HistorySection
        title="チケット購入履歴"
        description="決済ステータスや受付番号を確認できます。"
        tone="gold"
      >
        {history.ticketPurchases.length === 0 ? (
          <EmptyState message="購入履歴がまだありません。" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-white/80">
              <thead>
                <tr className="text-xs uppercase tracking-[0.3em] text-white/60">
                  <th className="px-3 py-2">日時</th>
                  <th className="px-3 py-2">チケット種類</th>
                  <th className="px-3 py-2">数量</th>
                  <th className="px-3 py-2">金額</th>
                  <th className="px-3 py-2">決済方法</th>
                  <th className="px-3 py-2">ステータス</th>
                  <th className="px-3 py-2">参照番号</th>
                </tr>
              </thead>
              <tbody>
                {history.ticketPurchases.map((purchase) => (
                  <tr key={purchase.id} className="border-t border-white/5">
                    <td className="px-3 py-3 align-top text-white/70">{formatDateTime(purchase.createdAt)}</td>
                    <td className="px-3 py-3 align-top">
                      <div className="font-semibold text-white">
                        {purchase.ticketTypeName ?? "不明"}
                      </div>
                      {purchase.ticketTypeCode && (
                        <p className="text-xs uppercase tracking-[0.25em] text-white/50">{purchase.ticketTypeCode}</p>
                      )}
                    </td>
                    <td className="px-3 py-3 align-top">×{purchase.quantity}</td>
                    <td className="px-3 py-3 align-top">{formatAmount(purchase.amountCents, purchase.currency)}</td>
                    <td className="px-3 py-3 align-top text-white/70">{purchase.paymentMethod}</td>
                    <td className="px-3 py-3 align-top">
                      <StatusBadge status={purchase.status} />
                    </td>
                    <td className="px-3 py-3 align-top">
                      <p className="font-mono text-xs text-white/60 break-all">
                        {purchase.externalReference ?? "-"}
                      </p>
                      {purchase.note && <p className="text-xs text-white/50">{purchase.note}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </HistorySection>

      <HistorySection
        title="ガチャプレイ履歴"
        description="獲得カードと反転発生の有無を確認できます。"
        tone="blue"
      >
        {history.gachaPlays.length === 0 ? (
          <EmptyState message="ガチャ履歴がまだありません。" />
        ) : (
          <GachaHistoryList entries={gachaEntries} />
        )}
      </HistorySection>

      <HistorySection
        title="カード送付/受取履歴"
        description="フレンド間のカード移動を記録します。"
        tone="pink"
      >
        {history.cardTransfers.length === 0 ? (
          <EmptyState message="カード送受信履歴がまだありません。" />
        ) : (
          <div className="space-y-4">
            {history.cardTransfers.map((transfer) => (
              <article
                key={transfer.id}
                className="rounded-3xl border border-white/10 bg-gradient-to-br from-pink-500/5 via-black/30 to-black/40 p-5 shadow-panel-inset"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <DirectionBadge direction={transfer.direction} />
                  <p className="text-xs uppercase tracking-[0.35em] text-white/60">{formatDateTime(transfer.createdAt)}</p>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <TransferField
                    label="カード"
                    value={<span className="font-display text-lg text-white">{transfer.cardName ?? "???"}</span>}
                    sub={transfer.cardRarity ?? "N"}
                  />
                  <TransferField
                    label="シリアル"
                    value={transfer.serialNumber ? `No.${String(transfer.serialNumber).padStart(3, "0")}` : "-"}
                  />
                  <TransferField
                    label={transfer.direction === "sent" ? "送り先" : "受取元"}
                    value={<span className="font-mono text-sm text-white/80 break-all">{transfer.counterpartLabel}</span>}
                  />
                  <TransferField label="メモ" value={transfer.note ?? "-"} />
                </div>
              </article>
            ))}
          </div>
        )}
      </HistorySection>

      <div className="text-center">
        <Link
          href="/mypage"
          className="inline-flex items-center justify-center rounded-full border border-white/20 bg-black/30 px-6 py-3 text-sm font-semibold text-white transition hover:border-neon-pink/60 hover:text-neon-pink"
        >
          ← メニューに戻る
        </Link>
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  helper,
  icon,
  accent,
}: {
  label: string;
  value: string;
  helper: string;
  icon: string;
  accent: string;
}) {
  return (
    <div className={`rounded-3xl border bg-gradient-to-br px-5 py-5 text-white shadow-panel-inset ${accent}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden>
          {icon}
        </span>
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.45em] text-white/70">{label}</p>
          <p className="font-display text-3xl">{value}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-white/70">{helper}</p>
    </div>
  );
}

function HistorySection({
  title,
  description,
  children,
  tone = "gold",
}: {
  title: string;
  description: string;
  children: ReactNode;
  tone?: HistorySectionTone;
}) {
  const toneStyles: Record<HistorySectionTone, { container: string; glow: string }> = {
    gold: {
      container: "border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 via-black/40 to-black/70",
      glow: "bg-yellow-500/30",
    },
    blue: {
      container: "border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-black/40 to-black/70",
      glow: "bg-blue-500/30",
    },
    pink: {
      container: "border-pink-500/20 bg-gradient-to-br from-pink-500/10 via-black/40 to-black/70",
      glow: "bg-pink-500/30",
    },
  };

  const toneClass = toneStyles[tone] ?? toneStyles.gold;

  return (
    <section className={`relative overflow-hidden rounded-3xl border p-6 shadow-panel-inset ${toneClass.container}`}>
      <div className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-[120px] ${toneClass.glow}`} aria-hidden />
      <div className="relative space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-white/70">{title}</p>
        <p className="text-sm text-white/80">{description}</p>
      </div>
      <div className="relative mt-4">{children}</div>
    </section>
  );
}

type HistorySectionTone = "gold" | "blue" | "pink";

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-3xl border border-dashed border-white/20 bg-white/5 px-4 py-6 text-center text-sm text-white/70">
      {message}
    </p>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status?.toLowerCase();
  const styles: Record<string, string> = {
    completed: "border-emerald-400/40 bg-emerald-500/15 text-emerald-100",
    pending: "border-yellow-400/40 bg-yellow-500/15 text-yellow-100",
    failed: "border-red-400/40 bg-red-500/15 text-red-100",
    refunded: "border-blue-400/40 bg-blue-500/15 text-blue-100",
    cancelled: "border-zinc-400/40 bg-zinc-500/15 text-zinc-100",
  };
  const className = styles[normalized] ?? "border-white/30 bg-white/10 text-white/70";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] ${className}`}>
      {status}
    </span>
  );
}

function DirectionBadge({ direction }: { direction: "sent" | "received" }) {
  const label = direction === "sent" ? "送付" : "受取";
  const className =
    direction === "sent"
      ? "border-neon-pink/40 bg-neon-pink/10 text-neon-pink"
      : "border-emerald-400/40 bg-emerald-500/15 text-emerald-100";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] ${className}`}>
      {label}
    </span>
  );
}

function TransferField({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div>
      <p className="text-[0.6rem] uppercase tracking-[0.4em] text-white/50">{label}</p>
      <div className="mt-1 text-sm text-white">{value}</div>
      {sub ? <p className="text-xs text-white/60">{sub}</p> : null}
    </div>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(amountCents: number, currency: string) {
  const amount = amountCents / 100;
  if (currency === "JPY") {
    return yenFormatter.format(amount);
  }
  return `${currency} ${amount.toFixed(2)}`;
}
