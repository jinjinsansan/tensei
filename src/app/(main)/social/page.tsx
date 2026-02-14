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
    <section className="space-y-6 text-primary">
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-accent">Social</p>
        <h1 className="text-3xl font-bold">フレンドとカード</h1>
        <p className="text-sm text-secondary">友だちとつながり、集めたカードを贈り合うことができます。</p>
      </div>

      <SocialClient
        userId={context.user.id}
        displayName={context.user.display_name ?? null}
        email={context.user.email ?? null}
      />

      <Link
        href="/home"
        className="flex h-12 items-center justify-center rounded-full border border-accent/30 text-[11px] uppercase tracking-[0.35em] text-primary"
      >
        ホームへ戻る
      </Link>
    </section>
  );
}
