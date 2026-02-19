import Link from "next/link";
import { notFound } from "next/navigation";

import { CollectionList } from "@/components/collection/collection-list";
import { fetchCollectionPageData } from "@/lib/collection/page-data";
import { fetchAuthedContext } from "@/lib/app/session";
import { getServiceSupabase } from "@/lib/supabase/service";

export default async function CollectionPage() {
  const supabase = getServiceSupabase();
  const context = await fetchAuthedContext(supabase);
  if (!context) {
    notFound();
  }

  const initialData = await fetchCollectionPageData(supabase, context.user.id, { limit: 24, offset: 0 });

  return (
    <section className="mx-auto w-full max-w-4xl space-y-8 pb-10">
      <div className="space-y-4 rounded-3xl border border-white/10 bg-black/30 px-6 py-7 text-center shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-purple">COLLECTION</p>
        <h1 className="font-display text-4xl text-white">カードコレクション</h1>
        <p className="text-sm text-zinc-300">ガチャで獲得したカードとシリアルのアーカイブ。</p>
      </div>

      {/* 所有者検証リンク */}
      <div className="relative flex justify-center">
        <div className="absolute inset-0 h-16 w-64 rounded-full bg-gradient-to-r from-[#ffe29f]/20 via-[#ffa99f]/20 to-[#fbc2eb]/20 blur-3xl" />
        <Link
          href="/verify-ownership"
          className="relative inline-flex items-center justify-center rounded-full border border-white/15 bg-gradient-to-r from-[#ffe29f] via-[#ffa99f] to-[#fbc2eb] px-10 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-[#201327] shadow-[0_20px_45px_rgba(0,0,0,0.45),inset_0_4px_0_rgba(255,255,255,0.75),inset_0_-4px_0_rgba(0,0,0,0.25)] transition hover:scale-[1.02] active:scale-[0.98]"
        >
          所有者データベース検索
        </Link>
      </div>

      <CollectionList initialData={initialData} />
    </section>
  );
}
