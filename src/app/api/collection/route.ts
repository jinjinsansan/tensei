import { NextResponse } from "next/server";

import { fetchAuthedContext } from "@/lib/app/session";
import { fetchCollectionSnapshot, sliceSnapshot } from "@/lib/collection/supabase";
import { fetchCollectionFromEdge, writeCollectionSnapshotToEdge } from "@/lib/cloudflare/collection-cache";
import { getServiceSupabase } from "@/lib/supabase/service";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

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

    const cached = await fetchCollectionFromEdge({ userId: context.user.id, limit, offset });
    if (cached) {
      return NextResponse.json(cached);
    }

    const snapshot = await fetchCollectionSnapshot(supabase, context.user.id);
    const responsePayload = sliceSnapshot(snapshot, limit, offset);

    await writeCollectionSnapshotToEdge(context.user.id, snapshot);

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("collection error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "図鑑情報を取得できませんでした。" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
