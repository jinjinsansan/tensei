import Link from "next/link";

import { CollectionList } from "@/components/collection/collection-list";

export default function CollectionPage() {
  return (
    <section className="mx-auto w-full max-w-4xl space-y-8 pb-10">
      <div className="space-y-4 rounded-3xl border border-white/10 bg-black/30 px-6 py-7 text-center shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-purple">COLLECTION</p>
        <h1 className="font-display text-4xl text-white">カードコレクション</h1>
        <p className="text-sm text-zinc-300">ガチャで獲得したカードとシリアルのアーカイブ。</p>
      </div>

      {/* 所有者検証リンク */}
      <Link
        href="/verify-ownership"
        className="block rounded-full border border-neon-yellow bg-neon-yellow/10 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-neon-yellow/20"
      >
        🔍 所有者検証データベース - シリアルナンバーから本物を確認
      </Link>

      <CollectionList />
    </section>
  );
}
