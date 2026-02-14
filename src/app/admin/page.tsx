import Link from "next/link";

const cards = [
  {
    title: "キャラクター管理",
    description: "新しいキャラクターの追加や期待度の調整を行います。",
    href: "/admin/characters",
  },
  {
    title: "カード管理",
    description: "カード画像、レアリティ、動画シナリオを更新します。",
    href: "/admin/cards",
  },
  {
    title: "ガチャ設定",
    description: "RTP・リバーサル率・キャラクター比率を編集します。",
    href: "/admin/settings",
  },
  {
    title: "カード在庫 / シリアル検索",
    description: "シリアルナンバーからカードの現在の所持者を特定します。",
    href: "/admin/inventory",
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
      <header>
        <h1 className="text-3xl font-bold">管理ダッシュボード</h1>
        <p className="text-sm text-slate-300">開発中のビルドのため、アクセス保護はまだ実装されていません。</p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-3xl bg-white/10 p-5 transition hover:bg-white/20"
          >
            <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Manage</p>
            <h2 className="mt-2 text-xl font-semibold">{card.title}</h2>
            <p className="mt-2 text-sm text-slate-200">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
