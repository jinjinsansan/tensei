import { NextResponse } from "next/server";

import { getServiceSupabase } from "@/lib/supabase/service";
import { getOrCreateSession } from "@/lib/data/session";
import { fetchAllCards, fetchAllCharacters, fetchCardCollection } from "@/lib/data/gacha";
import { getOrCreateSessionToken } from "@/lib/session/cookie";

export async function GET() {
  try {
    const token = await getOrCreateSessionToken();
    const supabase = getServiceSupabase();
    const session = await getOrCreateSession(supabase, token);

    const [cards, characters, collection] = await Promise.all([
      fetchAllCards(supabase),
      fetchAllCharacters(supabase),
      fetchCardCollection(supabase, session.id),
    ]);

    const ownedIds = new Set(collection.map((entry) => entry.card_id));
    const characterMap = new Map(characters.map((char) => [char.id, char]));

    const payload = cards.map((card) => ({
      id: card.id,
      name: card.card_name,
      starLevel: card.star_level,
      rarity: card.rarity,
      imageUrl: card.card_image_url,
      hasReversal: card.has_reversal,
      characterId: card.character_id,
      characterName: characterMap.get(card.character_id)?.name ?? "Unknown",
      owned: ownedIds.has(card.id),
    }));

    return NextResponse.json({ success: true, cards: payload });
  } catch (error) {
    console.error("collection error", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "図鑑情報を取得できませんでした。" },
      { status: 500 },
    );
  }
}
