import { NextResponse } from "next/server";

import { getServiceSupabase } from "@/lib/supabase/service";

export async function GET() {
  try {
    const supabase = getServiceSupabase();

    const { data: cards, error } = await supabase
      .from("cards")
      .select("id, card_name, person_name, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      cards: cards.map((card) => ({
        id: card.id,
        name: card.card_name,
        person_name: card.person_name,
      })),
    });
  } catch (error) {
    console.error("cards-list error", error);
    return NextResponse.json({ error: "カード一覧の取得に失敗しました" }, { status: 500 });
  }
}
