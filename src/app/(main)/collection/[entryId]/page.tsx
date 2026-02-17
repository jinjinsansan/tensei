import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { CollectionDetailClient } from "@/components/collection/collection-detail-client";
import { getSessionWithSnapshot } from "@/lib/app/session";
import { fetchCollectionEntryById } from "@/lib/collection/supabase";
import { getPublicEnv } from "@/lib/env";
import { getServiceSupabase } from "@/lib/supabase/service";

type PageProps = {
  params: Promise<{
    entryId: string;
  }>;
};

export default async function CollectionEntryPage({ params }: PageProps) {
  const { entryId } = await params;
  const supabase = getServiceSupabase();
  const context = await getSessionWithSnapshot(supabase).catch(() => null);
  if (!context) {
    notFound();
  }

  const entry = await fetchCollectionEntryById(supabase, context.user.id, entryId);

  if (!entry || !entry.cards) {
    notFound();
  }

  const shareUrl = await buildShareUrl(entry.id);

  const detailEntry = {
    id: entry.id,
    cardId: entry.card_id,
    cardName: entry.cards.name,
    rarity: entry.cards.rarity,
    starLevel: entry.cards.star_level ?? null,
    description: entry.cards.description ?? null,
    serialNumber: entry.serial_number,
    obtainedAt: entry.obtained_at ?? null,
    imageUrl: entry.cards.image_url ?? null,
    personName: entry.cards.person_name ?? null,
    cardStyle: entry.cards.card_style ?? null,
  };

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/collection"
          className="text-sm text-neon-blue underline-offset-4 transition hover:text-white hover:underline"
        >
          ← カードコレクションに戻る
        </Link>
        <p className="text-xs uppercase tracking-[0.4em] text-white/60">COLLECTION DETAIL</p>
      </div>
      <CollectionDetailClient entry={detailEntry} shareUrl={shareUrl} />
    </section>
  );
}

async function buildShareUrl(entryId: string) {
  const env = getPublicEnv();
  const explicitBase = env.NEXT_PUBLIC_SITE_URL ?? env.NEXT_PUBLIC_APP_URL ?? "";
  const normalized = explicitBase ? explicitBase.replace(/\/$/, "") : "";
  if (normalized) {
    return `${normalized}/collection/${entryId}`;
  }

  const hdrs = await headers();
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  if (host) {
    return `${proto}://${host}/collection/${entryId}`;
  }

  return `/collection/${entryId}`;
}
