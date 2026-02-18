import { NextResponse } from "next/server";

import { fetchAuthedContext } from "@/lib/app/session";
import { getServiceSupabase } from "@/lib/supabase/service";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const context = await fetchAuthedContext(supabase).catch(() => null);
  if (!context || !context.user.is_admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const pageParam = Number(url.searchParams.get("page") ?? "1");
  const pageSizeParam = Number(url.searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
  const pageSize = Number.isFinite(pageSizeParam)
    ? Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(pageSizeParam)))
    : DEFAULT_PAGE_SIZE;
  const offset = (page - 1) * pageSize;

  const cardQuery = url.searchParams.get("cardQuery")?.trim();
  const serialNumberParam = url.searchParams.get("serialNumber")?.trim();
  const dateFrom = url.searchParams.get("dateFrom")?.trim();
  const dateTo = url.searchParams.get("dateTo")?.trim();

  let serialNumber: number | null = null;
  if (serialNumberParam) {
    const parsed = Number(serialNumberParam);
    if (Number.isFinite(parsed)) {
      serialNumber = Math.floor(parsed);
    } else {
      return NextResponse.json({ error: "invalid serialNumber" }, { status: 400 });
    }
  }

  let query = supabase
    .from("gacha_results")
    .select(
      `id, created_at, completed_at, card_awarded, card_id, star_level, obtained_via,
       cards:card_id ( card_name, rarity ),
       inventory:card_inventory!card_inventory_gacha_result_id_fkey ( serial_number ),
       history:gacha_history!gacha_results_history_id_fkey ( result, result_detail )`,
      { count: "exact" },
    )
    .eq("app_user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (cardQuery) {
    query = query.ilike("cards.card_name", `%${cardQuery}%`);
  }
  if (serialNumber !== null) {
    query = query.eq("inventory.serial_number", serialNumber);
  }
  if (dateFrom) {
    const parsed = new Date(dateFrom);
    if (!Number.isNaN(parsed.valueOf())) {
      query = query.gte("created_at", parsed.toISOString());
    }
  }
  if (dateTo) {
    const parsed = new Date(dateTo);
    if (!Number.isNaN(parsed.valueOf())) {
      query = query.lte("created_at", parsed.toISOString());
    }
  }

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data ?? [],
    page,
    pageSize,
    total: count ?? 0,
  });
}
