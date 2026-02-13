import { NextResponse } from "next/server";

import { fetchAuthedContext } from "@/lib/app/session";
import { getServiceSupabase } from "@/lib/supabase/service";

export async function GET() {
  try {
    const supabase = getServiceSupabase();
    const context = await fetchAuthedContext(supabase);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [{ data: collectionData, error: collectionError }, { data: cardsData, error: cardsError }] = await Promise.all([
      supabase
        .from("card_inventory")
        .select(
          `card_id, serial_number, obtained_at,
           cards:card_inventory_card_id_fkey (
             id,
             card_name,
             rarity,
             description,
             card_image_url,
             max_supply,
             current_supply,
             person_name,
             card_style
           )`
        )
        .eq("app_user_id", context.user.id)
        .order("obtained_at", { ascending: false }),
      supabase
        .from("cards")
        .select("id, card_name, rarity, card_image_url")
        .eq("is_active", true)
        .order("rarity", { ascending: false })
    ]);

    if (collectionError) {
      throw new Error(collectionError.message);
    }
    if (cardsError) {
      throw new Error(cardsError.message);
    }

    const collection = (collectionData ?? []).map((item) => ({
      card_id: item.card_id,
      serial_number: item.serial_number,
      obtained_at: item.obtained_at,
      cards: item.cards
        ? {
            id: item.cards.id,
            name: item.cards.card_name,
            rarity: item.cards.rarity,
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

    const totalOwned = collection.length;
    const distinctOwned = new Set(collection.map((item) => item.card_id)).size;
    const totalAvailable = cards.length;

    return NextResponse.json({
      totalOwned,
      distinctOwned,
      totalAvailable,
      collection,
      cards,
    });
  } catch (error) {
    console.error("collection error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "図鑑情報を取得できませんでした。" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
