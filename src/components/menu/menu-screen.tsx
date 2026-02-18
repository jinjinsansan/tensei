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
      { title: "所有者検証", description: "シリアルナンバーから本物を確認", href: "/verify-ownership", badge: "NEW" },
    ],
  },
  {
    title: "チケット / 特典",
    links: [
      { title: "取引履歴", description: "決済・ガチャ・送付ログ", href: "/transactions", badge: "NEW" },
      { title: "友達紹介", description: "コード共有で+1枚", href: "/mypage/invite" },
      { title: "LINE特典", description: "LINE追加で+1枚", href: "/mypage/line" },
      { title: "チケット購入(準備中)", description: "有償パックを近日提供", href: "/purchase", badge: "SOON" },
    ],
  },
  {
    title: "サポート / 設定",
    links: [
      { title: "お知らせ受信箱", description: "管理者からのメルマガと通知", href: "/notifications", badge: "NEW" },
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
  "block rounded-3xl border border-white/15 bg-black/20 p-5 transition hover:border-neon-purple/50 hover:bg-neon-purple/5";

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
          <div className="rounded-2xl border border-neon-pink/30 bg-gradient-to-br from-pink-950/40 to-transparent px-4 py-3">
            <p className="text-[0.6rem] uppercase tracking-[0.35em] text-neon-pink/80">Total Tickets</p>
            <p className="font-display text-3xl text-neon-pink">{totalTickets}</p>
            <p className="text-xs text-zinc-400">FREE {freeTicket}</p>
          </div>
          <div className="rounded-2xl border border-neon-blue/30 bg-gradient-to-br from-blue-950/40 to-transparent px-4 py-3">
            <p className="text-[0.6rem] uppercase tracking-[0.35em] text-neon-blue/80">Last Login</p>
            <p className="font-display text-2xl text-neon-blue">{formatDate(snapshot.user?.lastLoginAt)}</p>
            <p className="text-xs text-zinc-400">最終アクセス</p>
          </div>
          <div className="rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-950/40 to-transparent px-4 py-3">
            <p className="text-[0.6rem] uppercase tracking-[0.35em] text-emerald-400/80">Status</p>
            <p className="font-display text-2xl text-emerald-300">ACTIVE</p>
            <p className="text-xs text-zinc-400">アカウント有効</p>
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
            <span className="rounded-full border border-neon-purple/30 bg-neon-purple/10 px-3 py-1 text-[0.6rem] uppercase tracking-[0.35em] text-neon-purple">
              {section.links.length} Links
            </span>
          </div>
          <div className="space-y-3">
            {section.links.map((link) => (
              <Link key={link.href} href={link.href} className={LINK_CARD}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-display text-lg text-white">{link.title}</p>
                    <p className="text-sm text-white/70">{link.description}</p>
                  </div>
                  {link.badge && (
                    <span className={`rounded-full border px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] ${
                      link.badge === 'NEW' 
                        ? 'border-neon-yellow/30 bg-neon-yellow/10 text-neon-yellow' 
                        : link.badge === 'SOON'
                        ? 'border-neon-blue/30 bg-neon-blue/10 text-neon-blue'
                        : 'border-zinc-500/30 bg-zinc-500/10 text-zinc-400'
                    }`}>
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
