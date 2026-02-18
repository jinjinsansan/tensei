import Link from "next/link";

import { AdminCard, AdminPageHero } from "@/components/admin/admin-ui";

const cards = [
  {
    title: "キャラクター別設定",
    description: "キャラクターごとの出現比率・RTP・どんでん返し率を管理します。",
    href: "/admin/characters",
  },
  {
    title: "カード管理",
    description: "カード画像、レアリティ、動画シナリオを更新します。",
    href: "/admin/cards",
  },
  {
    title: "共通ハズレ率設定",
    description: "全キャラクター共通のLOSS率を編集します。",
    href: "/admin/global",
  },
  {
    title: "演出確率設定",
    description: "STANDBY色・カウントダウン・タイトルヒント率を調整します。",
    href: "/admin/presentation",
  },
  {
    title: "カード在庫 / シリアル検索",
    description: "シリアルナンバーからカードの現在の所持者を特定します。",
    href: "/admin/inventory",
  },
  {
    title: "ユーザー管理",
    description: "チケット残高やブロック状態、ログインボーナスを確認・制御します。",
    href: "/admin/users",
  },
  {
    title: "統計ダッシュボード",
    description: "星ごとの出現率や人気カードを確認します。",
    href: "/admin/stats",
  },
];

export default function AdminHome() {
  return (
    <div className="space-y-6">
      <AdminPageHero
        eyebrow="Dashboard"
        title="管理ダッシュボード"
        description="カード、演出、RTPすべての設定エリアへアクセスできます。"
      />

      <AdminCard>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/40 hover:bg-white/10"
            >
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Manage</p>
              <h2 className="mt-3 text-xl font-semibold text-white">{card.title}</h2>
              <p className="mt-2 text-sm text-white/70">{card.description}</p>
              <span className="mt-auto inline-flex items-center gap-2 text-xs font-semibold text-white/70 group-hover:text-white">
                詳細を見る
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
