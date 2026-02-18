import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { CollectionDetailClient } from "@/components/collection/collection-detail-client";
import { fetchAuthedContext } from "@/lib/app/session";
import { fetchCollectionEntryById } from "@/lib/collection/supabase";
import { getPublicEnv } from "@/lib/env";
import { getServiceSupabase } from "@/lib/supabase/service";
import { fetchReferralCode } from "@/lib/data/referrals";

type PageProps = {
  params: Promise<{
    entryId: string;
  }>;
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { entryId } = await params;
  const supabase = getServiceSupabase();
  
  try {
    const context = await getSessionWithSnapshot(supabase).catch(() => null);
    if (!context) {
      return {
        title: "カード詳細 | 来世ガチャ",
      };
    }

    const entry = await fetchCollectionEntryById(supabase, context.user.id, entryId);
    
    if (!entry || !entry.cards) {
      return {
        title: "カード詳細 | 来世ガチャ",
      };
    }

    const shareUrl = await buildShareUrl(entry.id);
    const cardName = entry.cards.name;
    const description = entry.cards.description ?? `${cardName}を獲得しました！`;
    const imageUrl = entry.cards.image_url;
    
    // 画像の絶対URLを生成（OGPには絶対URLが必要）
    // metadataBaseがルートレイアウトで設定されているため、相対URLは自動的に絶対URLに変換される
    // ただし、署名付きURLなど既に絶対URLの場合はそのまま使用
    const ogImageUrl = imageUrl ? await buildAbsoluteImageUrl(imageUrl) : null;

    return {
      title: `${cardName} | 来世ガチャ`,
      description,
      openGraph: {
        title: `${cardName} | 来世ガチャ`,
        description,
        url: shareUrl,
        images: ogImageUrl ? [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: cardName,
          },
        ] : [],
        type: "website",
        siteName: "来世ガチャ",
      },
      twitter: {
        card: "summary_large_image",
        title: `${cardName} | 来世ガチャ`,
        description,
        images: ogImageUrl ? [ogImageUrl] : [],
      },
    };
  } catch {
    return {
      title: "カード詳細 | 来世ガチャ",
    };
  }
}

export default async function CollectionEntryPage({ params }: PageProps) {
  const { entryId } = await params;
  const supabase = getServiceSupabase();
  const context = await fetchAuthedContext(supabase).catch(() => null);
  if (!context) {
    notFound();
  }

  const entry = await fetchCollectionEntryById(supabase, context.user.id, entryId);

  if (!entry || !entry.cards) {
    notFound();
  }
  const referralCodeRow = context.user.referral_blocked
    ? null
    : await fetchReferralCode(supabase, context.user.id);
  const referralShareUrl = referralCodeRow?.code
    ? await buildReferralShareUrl(referralCodeRow.code)
    : null;
  const shareUrl = referralShareUrl ?? (await buildShareUrl(entry.id));

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
    isLossCard: Boolean(entry.cards.is_loss_card),
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
      <CollectionDetailClient
        entry={detailEntry}
        shareUrl={shareUrl}
        referralShareActive={Boolean(referralShareUrl)}
      />
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

async function buildReferralShareUrl(code: string) {
  const env = getPublicEnv();
  const explicitBase = env.NEXT_PUBLIC_SITE_URL ?? env.NEXT_PUBLIC_APP_URL ?? "";
  const normalized = explicitBase ? explicitBase.replace(/\/$/, "") : "";
  const params = new URLSearchParams({ ref: code });
  const suffix = `/register?${params.toString()}`;
  if (normalized) {
    return `${normalized}${suffix}`;
  }

  const hdrs = await headers();
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  if (host) {
    return `${proto}://${host}${suffix}`;
  }

  return suffix;
}

async function buildAbsoluteImageUrl(imagePath: string | null): Promise<string | null> {
  if (!imagePath) return null;
  
  // 既に絶対URLの場合はそのまま返す
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // サイトのベースURLを取得
  const env = getPublicEnv();
  const explicitBase = env.NEXT_PUBLIC_SITE_URL ?? env.NEXT_PUBLIC_APP_URL ?? "";
  const normalized = explicitBase ? explicitBase.replace(/\/$/, "") : "";
  
  if (normalized) {
    return `${normalized}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
  }

  // ヘッダーから推測
  const hdrs = await headers();
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  
  if (host) {
    return `${proto}://${host}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
  }

  return imagePath;
}
