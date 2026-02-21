import { NextResponse } from "next/server";

import { fetchAuthedContext } from "@/lib/app/session";
import { fetchCollectionPageData } from "@/lib/collection/page-data";
import { getServiceSupabase } from "@/lib/supabase/service";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const USE_WORKER_CACHE = process.env.CLOUDFLARE_COLLECTION_BASE_URL && process.env.CLOUDFLARE_COLLECTION_API_KEY;

export async function GET(request: Request) {
  try {
    const supabase = getServiceSupabase();
    const context = await fetchAuthedContext(supabase);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const offsetParam = url.searchParams.get("offset");
    const rawLimit = Number.isFinite(Number(limitParam)) ? Number(limitParam) : DEFAULT_LIMIT;
    const rawOffset = Number.isFinite(Number(offsetParam)) ? Number(offsetParam) : 0;
    const limit = Math.min(Math.max(rawLimit || DEFAULT_LIMIT, 1), MAX_LIMIT);
    const offset = Math.max(rawOffset || 0, 0);

    // Try Cloudflare Worker cache first
    if (USE_WORKER_CACHE) {
      try {
        const workerUrl = new URL('/collection', process.env.CLOUDFLARE_COLLECTION_BASE_URL);
        workerUrl.searchParams.set('userId', context.user.id);
        workerUrl.searchParams.set('limit', String(limit));
        workerUrl.searchParams.set('offset', String(offset));

        const workerResponse = await fetch(workerUrl.toString(), {
          headers: {
            'Authorization': `Bearer ${process.env.CLOUDFLARE_COLLECTION_API_KEY}`,
          },
        });

        if (workerResponse.ok) {
          const data = await workerResponse.json();
          return NextResponse.json(data);
        }

        // If 404, fall through to DB fetch and sync
        if (workerResponse.status !== 404) {
          console.warn('Worker fetch failed:', workerResponse.status, await workerResponse.text());
        }
      } catch (workerError) {
        console.warn('Worker request failed, falling back to DB:', workerError);
      }
    }

    // Fallback: fetch from DB
    const payload = await fetchCollectionPageData(supabase, context.user.id, { limit, offset });

    // Sync snapshot to Worker (fire-and-forget)
    if (USE_WORKER_CACHE) {
      syncSnapshotToWorker(context.user.id, payload).catch((err) => {
        console.error('Failed to sync snapshot to worker:', err);
      });
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("collection error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "図鑑情報を取得できませんでした。" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

async function syncSnapshotToWorker(userId: string, data: unknown) {
  if (!process.env.CLOUDFLARE_COLLECTION_BASE_URL || !process.env.CLOUDFLARE_COLLECTION_API_KEY) {
    return;
  }

  const workerUrl = new URL('/collection/snapshot', process.env.CLOUDFLARE_COLLECTION_BASE_URL);
  
  const payload = data as {
    collection?: unknown[];
    cards?: unknown[];
    totalOwned?: number;
    distinctOwned?: number;
    totalAvailable?: number;
  };
  
  await fetch(workerUrl.toString(), {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${process.env.CLOUDFLARE_COLLECTION_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      snapshot: {
        collection: payload.collection || [],
        cards: payload.cards || [],
        totalOwned: payload.totalOwned || 0,
        distinctOwned: payload.distinctOwned || 0,
        totalAvailable: payload.totalAvailable || 0,
        updatedAt: new Date().toISOString(),
      },
    }),
  });
}
