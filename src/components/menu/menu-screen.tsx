import Link from "next/link";
import { SignOutButton } from "@/components/menu/sign-out-button";
import type { MainAppSnapshot } from "@/lib/app/main-app";

const sections = [
  {
    title: "ガチャ / コレクション",
    links: [
      { title: "ホーム", description: "最新ガチャとチケット残高", href: "/home" },
      { title: "ガチャ一覧", description: "単発・連続ガチャ", href: "/gacha" },
      { title: "コレクション", description: "所持カード管理", href: "/collection" },
    ],
  },
  {
    title: "チケット / 特典",
    links: [
      { title: "マイページ", description: "全体ダッシュボード", href: "/mypage" },
      { title: "チケット管理", description: "残高・履歴・購入", href: "/mypage/tickets", badge: "NEW" },
      { title: "友達紹介", description: "コード共有で+1枚", href: "/mypage/invite" },
      { title: "LINE特典", description: "LINE追加で+1枚", href: "/mypage/line" },
      { title: "チケット購入(準備中)", description: "有償パックを近日提供", href: "/purchase", badge: "SOON" },
    ],
  },
  {
    title: "サポート / 設定",
    links: [
      { title: "使い方ガイド", description: "遊び方を確認", href: "/how-to-play", badge: "NEW" },
      { title: "ヘルプセンター", description: "よくある質問 (準備中)", href: "mailto:support@raisegacha.com", badge: "EMAIL" },
      { title: "パスワード変更", description: "メール経由で更新", href: "/reset" },
      { title: "利用規約", description: "注意事項を確認", href: "/terms" },
    ],
  },
];

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ja-JP", { month: "short", day: "numeric" });
}

const SECTION_CARD = "space-y-4 rounded-3xl border border-white/10 bg-black/25 p-6 shadow-panel-inset";
const LINK_CARD =
  "group relative overflow-hidden rounded-3xl border border-white/12 bg-black/30 p-5 shadow-panel-inset transition hover:border-white/40";

type MenuScreenProps = {
  snapshot: MainAppSnapshot;
};

export function MenuScreen({ snapshot }: MenuScreenProps) {
  const totalTickets = snapshot.tickets.reduce((sum, ticket) => sum + (ticket.quantity ?? 0), 0);
  const freeTicket = snapshot.tickets.find((ticket) => ticket.code === "free")?.quantity ?? 0;

  return (
    <section className="mx-auto w-full max-w-5xl space-y-8 pb-12">
      <div className="space-y-4 rounded-3xl border border-white/10 bg-black/30 px-6 py-8 shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-yellow">PLAYER MENU</p>
        <div className="space-y-1">
          <h1 className="font-display text-4xl text-white">メニューホール</h1>
          <p className="text-sm text-zinc-300">{snapshot.user?.email ?? "unknown"}</p>
          <p className="text-sm text-zinc-400">来世ガチャの各セクションへ一括アクセスする管理ホールです。</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
            <p className="text-[0.6rem] uppercase tracking-[0.35em] text-white/60">Total Tickets</p>
            <p className="font-display text-3xl text-white">{totalTickets}</p>
            <p className="text-xs text-white/70">FREE {freeTicket}</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
            <p className="text-[0.6rem] uppercase tracking-[0.35em] text-white/60">Last Login</p>
            <p className="font-display text-2xl text-white">{formatDate(snapshot.user?.lastLoginAt)}</p>
            <p className="text-xs text-white/70">最終アクセス</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
            <p className="text-[0.6rem] uppercase tracking-[0.35em] text-white/60">Status</p>
            <p className="font-display text-2xl text-white">ACTIVE</p>
            <p className="text-xs text-white/70">アカウント有効</p>
          </div>
        </div>
      </div>

      {sections.map((section) => (
        <section key={section.title} className={SECTION_CARD}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-neon-purple">{section.title}</p>
              <p className="text-sm text-zinc-400">関連メニューへのショートカット</p>
            </div>
            <span className="rounded-full border border-white/15 px-3 py-1 text-[0.6rem] uppercase tracking-[0.35em] text-white/60">
              {section.links.length} Links
            </span>
          </div>
          <div className="space-y-3">
            {section.links.map((link) => (
              <Link key={link.href} href={link.href} className={LINK_CARD}>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition group-hover:opacity-40" />
                <div className="relative z-10 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-display text-lg text-white">{link.title}</p>
                    <p className="text-sm text-white/70">{link.description}</p>
                  </div>
                  {link.badge && (
                    <span className="rounded-full border border-white/20 px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-white/80">
                      {link.badge}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className={SECTION_CARD}>
        <p className="text-xs uppercase tracking-[0.4em] text-red-300">Sign Out</p>
        <p className="text-sm text-zinc-400">端末の共有時は必ずサインアウトしてください。</p>
        <SignOutButton />
      </section>
    </section>
  );
}
