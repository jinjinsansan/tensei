import type { ReactNode } from "react";

import { notFound } from "next/navigation";

import { fetchAuthedContext } from "@/lib/app/session";
import { getServiceSupabase } from "@/lib/supabase/service";
import { fetchTransactionHistory } from "@/lib/data/transactions";

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

  return (
    <section className="mx-auto w-full max-w-5xl space-y-8 pb-12">
      <header className="space-y-3 rounded-3xl border border-white/10 bg-black/30 px-6 py-8 text-center shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-yellow">Transaction History</p>
        <h1 className="font-display text-4xl text-white">取引履歴</h1>
        <p className="text-sm text-zinc-300">
          チケット購入・ガチャ結果・カード送受信の履歴をまとめて確認できます。
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="購入件数"
          value={`${history.ticketPurchases.length}件`}
          helper={yenFormatter.format(totalPurchasesYen / 100)}
          accent="text-neon-yellow"
        />
        <SummaryCard
          label="ガチャ履歴"
          value={`${history.gachaPlays.length}件`}
          helper="最新50件"
          accent="text-neon-blue"
        />
        <SummaryCard
          label="カード送受信"
          value={`${history.cardTransfers.length}件`}
          helper="フレンド配送"
          accent="text-neon-pink"
        />
      </div>

      <HistorySection title="チケット購入履歴" description="決済ステータスや受付番号を確認できます。">
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

      <HistorySection title="ガチャプレイ履歴" description="獲得カードと反転発生の有無を確認できます。">
        {history.gachaPlays.length === 0 ? (
          <EmptyState message="ガチャ履歴がまだありません。" />
        ) : (
          <div className="space-y-3">
            {history.gachaPlays.map((play) => (
              <div
                key={play.id}
                className="rounded-3xl border border-white/10 bg-black/25 p-4 shadow-panel-inset"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/60">{formatDateTime(play.createdAt)}</p>
                    <p className="font-display text-xl text-white">
                      {play.cardName ?? "???"}
                      <span className="ml-2 text-sm text-white/70">★{play.starLevel}</span>
                    </p>
                    <p className="text-xs text-white/60">
                      {play.characterName ?? "キャラクター不明"} / {play.cardRarity ?? "N"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.35em] text-white/60">Result ID</p>
                    <p className="font-mono text-sm text-white/80">{play.historyId ?? "-"}</p>
                    <p className="text-xs text-white/70">
                      {play.hadReversal ? "逆転演出あり" : "通常演出"} ・ {play.obtainedVia}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </HistorySection>

      <HistorySection title="カード送付/受取履歴" description="フレンド間のカード移動を記録します。">
        {history.cardTransfers.length === 0 ? (
          <EmptyState message="カード送受信履歴がまだありません。" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-white/80">
              <thead>
                <tr className="text-xs uppercase tracking-[0.3em] text-white/60">
                  <th className="px-3 py-2">日時</th>
                  <th className="px-3 py-2">方向</th>
                  <th className="px-3 py-2">カード</th>
                  <th className="px-3 py-2">シリアル</th>
                  <th className="px-3 py-2">相手</th>
                  <th className="px-3 py-2">メモ</th>
                </tr>
              </thead>
              <tbody>
                {history.cardTransfers.map((transfer) => (
                  <tr key={transfer.id} className="border-t border-white/5">
                    <td className="px-3 py-3 align-top text-white/70">{formatDateTime(transfer.createdAt)}</td>
                    <td className="px-3 py-3 align-top">
                      <DirectionBadge direction={transfer.direction} />
                    </td>
                    <td className="px-3 py-3 align-top">
                      <p className="font-semibold text-white">{transfer.cardName ?? "???"}</p>
                      <p className="text-xs text-white/60">{transfer.cardRarity ?? "N"}</p>
                    </td>
                    <td className="px-3 py-3 align-top">{transfer.serialNumber ? `No.${String(transfer.serialNumber).padStart(3, "0")}` : "-"}</td>
                    <td className="px-3 py-3 align-top">
                      <p className="font-mono text-xs text-white/70 break-all">{transfer.counterpartLabel}</p>
                    </td>
                    <td className="px-3 py-3 align-top text-white/60">{transfer.note ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </HistorySection>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  helper,
  accent,
}: {
  label: string;
  value: string;
  helper: string;
  accent: string;
}) {
  return (
    <div className="rounded-3xl border border-white/15 bg-black/30 px-4 py-4 text-white shadow-panel-inset">
      <p className={`text-[0.6rem] uppercase tracking-[0.4em] ${accent}`}>{label}</p>
      <p className="font-display text-3xl">{value}</p>
      <p className="text-xs text-white/70">{helper}</p>
    </div>
  );
}

function HistorySection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-3xl border border-white/10 bg-black/25 p-6 shadow-panel-inset">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-neon-purple">{title}</p>
        <p className="text-sm text-white/70">{description}</p>
      </div>
      {children}
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-3xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-center text-sm text-white/60">
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
