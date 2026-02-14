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
    <section className="mx-auto w-full max-w-md space-y-8">
      <div className="space-y-2 text-center">
        <div className="relative inline-block">
          <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-pink-500/15 blur-2xl" />
          <h1 className="relative font-display text-4xl font-bold tracking-[0.05em] text-transparent bg-gradient-to-r from-[#fff65c] via-[#ff9b3d] to-[#ff2d95] bg-clip-text drop-shadow-[0_0_40px_rgba(255,246,92,0.8)] drop-shadow-[0_0_70px_rgba(255,157,61,0.6)] drop-shadow-[0_4px_18px_rgba(0,0,0,0.9)]">
            フレンドとカード
          </h1>
        </div>
        <p className="text-sm text-white/75">友だちとつながり、集めたカードを贈り合うことができます。</p>
      </div>

      <SocialClient
        userId={context.user.id}
        displayName={context.user.display_name ?? null}
        email={context.user.email ?? null}
      />

      <Link
        href="/home"
        className="flex h-12 items-center justify-center rounded-full border border-white/20 text-[11px] uppercase tracking-[0.35em] text-white/80 hover:border-neon-blue hover:text-white"
      >
        ホームへ戻る
      </Link>
    </section>
  );
}
