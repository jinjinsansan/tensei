import { CollectionGrid } from "@/components/collection/collection-grid";

export default function CollectionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-12">
        <header className="space-y-2 text-center sm:text-left">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Card Collection</p>
          <h1 className="text-3xl font-bold">転生カード図鑑</h1>
          <p className="text-sm text-slate-300">
            これまでに解放した転生カードを確認できます。グレーのカードはまだ未取得。ガチャで解放して図鑑を完成させましょう。
          </p>
        </header>
        <CollectionGrid />
      </div>
    </div>
  );
}
