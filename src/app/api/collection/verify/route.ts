import { NextResponse } from "next/server";

import { getServiceSupabase } from "@/lib/supabase/service";
import { fetchAuthedContext } from "@/lib/app/session";

export async function POST(req: Request) {
  try {
    const supabase = getServiceSupabase();
    
    // 認証は不要（誰でもアクセス可能）だが、ログインユーザーの判定には必要
    const context = await fetchAuthedContext(supabase).catch(() => null);
    const currentUserId = context?.user.id ?? null;

    const body = await req.json();
    const { cardId, serialNumber } = body as {
      cardId?: string;
      serialNumber?: number;
    };

    if (!cardId || typeof serialNumber !== "number") {
      return NextResponse.json(
        { error: "cardId と serialNumber は必須です" },
        { status: 400 }
      );
    }

    // カード在庫を検索
    const { data: inventory, error: invError } = await supabase
      .from("card_inventory")
      .select(`
        id,
        card_id,
        serial_number,
        obtained_at,
        app_user_id,
        cards (
          card_name,
          rarity,
          star_level,
          card_image_url,
          person_name
        )
      `)
      .eq("card_id", cardId)
      .eq("serial_number", serialNumber)
      .maybeSingle();

    if (invError) {
      throw invError;
    }

    if (!inventory) {
      return NextResponse.json({
        found: false,
      });
    }

    // 所有者情報の加工（プライバシー保護）
    const ownerId = inventory.app_user_id;
    const isOwn = currentUserId === ownerId;
    
    // 所有者IDの最初の8文字を表示、残りを *** に置き換え
    const ownerDisplay = ownerId.substring(0, 8) + "***";

    const card = Array.isArray(inventory.cards) ? inventory.cards[0] : inventory.cards;

    return NextResponse.json({
      found: true,
      card: {
        card_name: card?.card_name ?? "不明",
        rarity: card?.rarity ?? "N",
        star_level: card?.star_level ?? null,
        image_url: card?.card_image_url ?? null,
        person_name: card?.person_name ?? null,
      },
      serial_number: inventory.serial_number,
      obtained_at: inventory.obtained_at,
      owner_id: ownerId,
      owner_display: ownerDisplay,
      is_own: isOwn,
    });
  } catch (error) {
    console.error("verify ownership error", error);
    return NextResponse.json(
      { error: "所有者検証に失敗しました" },
      { status: 500 }
    );
  }
}
