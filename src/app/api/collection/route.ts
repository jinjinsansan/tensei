import { NextResponse } from "next/server";

import { fetchAuthedContext } from "@/lib/app/session";
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

    const [
      { data: collectionData, error: collectionError, count: totalOwnedCount },
      { data: cardsData, error: cardsError },
      { count: distinctOwnedCount, error: distinctError },
    ] = await Promise.all([
      supabase
        .from("card_inventory")
        .select(
          `id, card_id, serial_number, obtained_at,
           cards:card_inventory_card_id_fkey (
             id,
             card_name,
             rarity,
             star_level,
             description,
             card_image_url,
             max_supply,
             current_supply,
             person_name,
             card_style
           )`,
          { count: "exact" }
        )
        .eq("app_user_id", context.user.id)
        .order("obtained_at", { ascending: false })
        .range(offset, offset + limit - 1),
      supabase
        .from("cards")
        .select("id, card_name, rarity, card_image_url")
        .eq("is_active", true)
        .order("rarity", { ascending: false }),
      supabase
        .from("card_collection")
        .select("id", { count: "exact", head: true })
        .eq("app_user_id", context.user.id),
    ]);

    if (collectionError) {
      throw new Error(collectionError.message);
    }
    if (cardsError) {
      throw new Error(cardsError.message);
    }
    if (distinctError) {
      throw new Error(distinctError.message);
    }

    const collection = (collectionData ?? []).map((item) => ({
      id: item.id,
      card_id: item.card_id,
      serial_number: item.serial_number,
      obtained_at: item.obtained_at,
      cards: item.cards
        ? {
            id: item.cards.id,
            name: item.cards.card_name,
            rarity: item.cards.rarity,
            star_level: item.cards.star_level,
            description: item.cards.description,
            image_url: item.cards.card_image_url,
            max_supply: item.cards.max_supply,
            current_supply: item.cards.current_supply,
            person_name: item.cards.person_name,
            card_style: item.cards.card_style,
          }
        : null,
    }));

    const cards = (cardsData ?? []).map((card) => ({
      id: card.id,
      name: card.card_name,
      rarity: card.rarity,
      image_url: card.card_image_url,
    }));

    const totalOwned = totalOwnedCount ?? collection.length;
    const distinctOwned = distinctOwnedCount ?? new Set(collection.map((item) => item.card_id)).size;
    const totalAvailable = cards.length;

    const hasMore = totalOwned > offset + collection.length;

    return NextResponse.json({
      totalOwned,
      distinctOwned,
      totalAvailable,
      collection,
      cards,
      page: {
        limit,
        offset,
        hasMore,
      },
    });
  } catch (error) {
    console.error("collection error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "図鑑情報を取得できませんでした。" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
