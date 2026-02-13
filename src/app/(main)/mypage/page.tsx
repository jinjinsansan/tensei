import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginBonusCardClient } from "@/components/home/login-bonus-card-client";
import { TicketBalanceCarousel } from "@/components/home/ticket-balance-carousel";
import { GachaHistory } from "@/components/gacha/gacha-history";
import { fetchAuthedContext } from "@/lib/app/session";
import { getTicketBalances } from "@/lib/data/tickets";
import { getServiceSupabase } from "@/lib/supabase/service";

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ja-JP");
}

export default async function MyPage() {
  const context = await fetchAuthedContext();
  if (!context) {
    redirect("/login");
  }
  const { user } = context;

  const supabase = getServiceSupabase();

  const [
    tickets,
    inventoryResult,
    cardsResult,
    referralCodeResult,
    referralClaimsResult,
    lineLinkResult,
  ] = await Promise.all([
    getTicketBalances(supabase, user.id),
    supabase
      .from("card_inventory")
      .select("card_id, obtained_at")
      .eq("owner_id", user.id)
      .order("obtained_at", { ascending: false }),
    supabase
      .from("cards")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("referral_codes")
      .select("code, uses")
      .eq("app_user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("referral_claims")
      .select("id, status, created_at, referral_codes!inner()")
      .eq("referral_codes.app_user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("line_link_requests")
      .select("linked, linked_at")
      .eq("app_user_id", user.id)
      .eq("linked", true)
      .limit(1)
      .maybeSingle(),
  ]);

  const hasDataError = inventoryResult.error || cardsResult.error;
  const inventory = inventoryResult.data ?? [];
  const totalOwned = inventory.length;
  const distinctOwned = new Set(inventory.map((item) => item.card_id)).size;
  const totalCatalog = cardsResult.count ?? 0;
  const completion = totalCatalog > 0 ? Math.round((distinctOwned / totalCatalog) * 100) : 0;
  const latestObtainedAt = inventory[0]?.obtained_at ?? null;

  const referralCode = referralCodeResult.data;
  const referralClaims = referralClaimsResult.data ?? [];
  const totalInvites = referralClaims.length;
  const rewardedInvites = referralClaims.filter((claim) => claim.status === "granted").length;
  const inviteCode = referralCode?.code ?? null;

  const lineLink = lineLinkResult.data ?? null;
  const lineStatus = lineLink
    ? "連携済み"
    : "未連携";

  const totalTickets = tickets.reduce((sum, ticket) => sum + (ticket.quantity ?? 0), 0);
  const freeTicket = tickets.find((ticket) => ticket.code === "free");

  const quickLinks = [
    {
      title: "友達紹介",
      description: "紹介成立で双方+1枚",
      href: "/mypage/invite",
      stat: inviteCode ? `CODE: ${inviteCode}` : "CODE未発行",
      meta: `${rewardedInvites}/${totalInvites || 0} 人が特典獲得`,
    },
    {
      title: "LINE特典",
      description: "LINE公式追加で1枚プレゼント",
      href: "/mypage/line",
      stat: lineStatus,
      meta: lineLink?.linked_at ? `連携日 ${formatDate(lineLink.linked_at)}` : "最短30秒",
    },
    {
      title: "チケット管理",
      description: "残高・履歴・購入申込",
      href: "/mypage/tickets",
      stat: `${totalTickets} 枚`,
      meta: freeTicket ? `FREE ${freeTicket.quantity}枚` : "FREE 0枚",
    },
    {
      title: "ガチャ履歴",
      description: "直近の結果をまとめて確認",
      href: "/mypage/history",
      stat: latestObtainedAt ? formatDate(latestObtainedAt) : "未プレイ",
      meta: "履歴ページへ",
    },
  ];

  return (
    <section className="space-y-8">
      <div className="space-y-3 rounded-3xl border border-white/10 bg-black/30 px-6 py-7 shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-blue">RAISE DASHBOARD</p>
        <div className="space-y-1">
          <h1 className="font-display text-3xl text-white">ネオンホール マイページ</h1>
          <p className="text-sm text-zinc-300">ログイン中: {user.email}</p>
        </div>
        <p className="text-sm text-zinc-400">
          チケット残高、カードコレクション、招待状況、特典連携をここでまとめて確認できます。
        </p>
      </div>

      {hasDataError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          一部のデータの読み込みに失敗しました。ページを再読み込みしてください。
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-black/25 p-5 shadow-panel-inset">
          <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">Tickets</p>
          <p className="mt-2 font-display text-3xl text-white">{totalTickets} 枚</p>
          <p className="text-sm text-zinc-400">
            FREE {freeTicket?.quantity ?? 0} / TOTAL {totalTickets}
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/25 p-5 shadow-panel-inset">
          <p className="text-xs uppercase tracking-[0.4em] text-neon-purple">Collection</p>
          <p className="mt-2 font-display text-3xl text-white">
            {distinctOwned}/{totalCatalog || "-"}
          </p>
          <p className="text-sm text-zinc-400">コンプ率 {completion}% ・ 所持 {totalOwned} 枚</p>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <div>
            <p className="uppercase tracking-[0.4em] text-neon-yellow">Tickets</p>
            <p>現在の残高</p>
          </div>
          <Link href="/mypage/tickets" className="text-[11px] uppercase tracking-[0.35em] text-neon-blue">
            詳細を見る
          </Link>
        </div>
        <TicketBalanceCarousel tickets={tickets} />
      </section>

      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">Login Bonus</p>
        <LoginBonusCardClient />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {quickLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-3xl border border-white/10 bg-black/25 p-5 shadow-panel-inset transition hover:border-neon-blue"
          >
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">{item.title}</p>
            <h2 className="mt-2 font-display text-xl text-white">{item.description}</h2>
            <p className="mt-3 text-sm text-neon-yellow">{item.stat}</p>
            <p className="text-xs text-zinc-400">{item.meta}</p>
            <span className="mt-4 inline-flex items-center text-[11px] uppercase tracking-[0.35em] text-neon-blue">
              TAP TO MANAGE →
            </span>
          </Link>
        ))}
      </section>

      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-purple">History</p>
        <GachaHistory title="最近のガチャ履歴" limit={6} />
      </section>
    </section>
  );
}
