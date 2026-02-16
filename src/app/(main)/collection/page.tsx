import { CollectionList } from "@/components/collection/collection-list";

export default function CollectionPage() {
  return (
    <section className="mx-auto w-full max-w-4xl space-y-8 pb-10">
      <div className="space-y-4 rounded-3xl border border-white/10 bg-black/30 px-6 py-7 text-center shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-purple">COLLECTION</p>
        <h1 className="font-display text-4xl text-white">カードコレクション</h1>
        <p className="text-sm text-zinc-300">来世ガチャで獲得したカードとシリアルのアーカイブ。</p>
      </div>
      <CollectionList />
    </section>
  );
}
