import { NextResponse } from "next/server";

import { fetchAuthedContext } from "@/lib/app/session";
import { getServiceSupabase } from "@/lib/supabase/service";
import { emitCollectionEventToEdge } from "@/lib/cloudflare/collection-cache";
import { buildCollectionEntryFromInventory } from "@/lib/collection/supabase";
import { fetchCardById } from "@/lib/data/gacha";

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

    // カード情報を取得
    const card = await fetchCardById(supabase, inventoryRow.card_id);

    // TODO: 送信者側キャッシュ削除用（将来実装）
    // const { count: senderOtherCopies } = await supabase
    //   .from("card_inventory")
    //   .select("id", { count: "exact", head: true })
    //   .eq("app_user_id", fromUserId)
    //   .eq("card_id", inventoryRow.card_id)
    //   .neq("id", cardInventoryId);

    // 受信者が既にこのカードを持っているかチェック
    const { count: receiverExistingCopies } = await supabase
      .from("card_inventory")
      .select("id", { count: "exact", head: true })
      .eq("app_user_id", toUserId)
      .eq("card_id", inventoryRow.card_id);

    const { error: updateError } = await supabase
      .from("card_inventory")
      .update({ app_user_id: toUserId, obtained_at: new Date().toISOString() })
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

    // TODO: 送信者のキャッシュからカードを削除する処理
    // Cloudflare Worker側で削除イベント（delete event）のサポートが必要
    // 実装時は senderOtherCopies を使って distinctOwnedDelta を計算
    // distinctOwnedDelta: 他のコピーがなければ -1、あれば 0
    
    // 受信者のキャッシュを更新（カードを追加）
    const { data: updatedInventory } = await supabase
      .from("card_inventory")
      .select("*")
      .eq("id", cardInventoryId)
      .single();

    if (updatedInventory) {
      const entry = buildCollectionEntryFromInventory(updatedInventory, card);
      // distinctOwnedDelta: 既に持っていれば 0、新規なら +1
      const receiverDistinctDelta = (receiverExistingCopies ?? 0) > 0 ? 0 : 1;
      
      // 受信者側にカードを追加
      void emitCollectionEventToEdge(toUserId, {
        entry,
        totalOwnedDelta: 1,
        distinctOwnedDelta: receiverDistinctDelta,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("card send error", error);
    return NextResponse.json({ error: "カード送付に失敗しました" }, { status: 500 });
  }
}
