import { NextResponse } from "next/server";

import { fetchAuthedContext } from "@/lib/app/session";
import { getServiceSupabase } from "@/lib/supabase/service";

export async function POST(req: Request) {
  try {
    const supabase = getServiceSupabase();
    const context = await fetchAuthedContext(supabase);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { cardInventoryId, toUserId } = (await req.json()) as {
      cardInventoryId?: string;
      toUserId?: string;
    };

    if (!cardInventoryId || !toUserId) {
      return NextResponse.json({ error: "cardInventoryId と toUserId は必須です" }, { status: 400 });
    }

    const fromUserId = context.user.id;
    if (fromUserId === toUserId) {
      return NextResponse.json({ error: "自分自身には送付できません" }, { status: 400 });
    }

    const { data: friendRow } = await supabase
      .from("friends")
      .select("id")
      .eq("user_id", fromUserId)
      .eq("friend_user_id", toUserId)
      .maybeSingle();
    if (!friendRow) {
      return NextResponse.json({ error: "フレンドのみカード送付が可能です" }, { status: 403 });
    }

    const { data: inventoryRow, error: invError } = await supabase
      .from("card_inventory")
      .select("id, app_user_id, card_id, serial_number")
      .eq("id", cardInventoryId)
      .eq("app_user_id", fromUserId)
      .single();

    if (invError || !inventoryRow) {
      return NextResponse.json({ error: "カードが見つからないか、あなたの所有ではありません" }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("card_inventory")
      .update({ app_user_id: toUserId })
      .eq("id", cardInventoryId)
      .eq("app_user_id", fromUserId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    const { error: transferError } = await supabase.from("card_transfers").insert({
      card_inventory_id: inventoryRow.id,
      from_user_id: fromUserId,
      to_user_id: toUserId,
    });

    if (transferError) {
      throw new Error(transferError.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("card send error", error);
    return NextResponse.json({ error: "カード送付に失敗しました" }, { status: 500 });
  }
}
