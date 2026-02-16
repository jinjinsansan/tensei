import Link from "next/link";
import { redirect } from "next/navigation";

import { fetchAuthedContext } from "@/lib/app/session";
import { SocialClient } from "@/components/social/SocialClient";

export default async function SocialPage() {
  const context = await fetchAuthedContext();
  if (!context) {
    redirect("/login");
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-8 pb-10">
      <div className="space-y-4 rounded-3xl border border-white/10 bg-black/30 px-6 py-8 text-center shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-purple">SOCIAL HUB</p>
        <h1 className="font-display text-4xl text-white">ソーシャルホール</h1>
        <p className="text-sm text-zinc-300">友だちIDを交換し、シリアル入りカードを送り合うホール。来世で出会った仲間と交流しましょう。</p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-[0.65rem] uppercase tracking-[0.35em] text-white/70">
          <span className="rounded-full border border-white/15 px-4 py-1">Friend Requests</span>
          <span className="rounded-full border border-white/15 px-4 py-1">Card Transfer</span>
          <span className="rounded-full border border-white/15 px-4 py-1">Serial Archive</span>
        </div>
      </div>

      <SocialClient
        userId={context.user.id}
        displayName={context.user.display_name ?? null}
        email={context.user.email ?? null}
      />

      <div className="relative flex justify-center">
        <div className="absolute inset-0 h-16 w-64 rounded-full bg-gradient-to-r from-[#ffe29f]/20 via-[#ffa99f]/20 to-[#fbc2eb]/20 blur-3xl" />
        <Link
          href="/home"
          className="relative inline-flex items-center justify-center rounded-full border border-white/15 bg-gradient-to-r from-[#ffe29f] via-[#ffa99f] to-[#fbc2eb] px-10 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-[#201327] shadow-[0_20px_45px_rgba(0,0,0,0.45),inset_0_4px_0_rgba(255,255,255,0.75),inset_0_-4px_0_rgba(0,0,0,0.25)] transition hover:scale-[1.02] active:scale-[0.98]"
        >
          ホームへ戻る
        </Link>
      </div>
    </section>
  );
}
