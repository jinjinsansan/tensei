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

    const { cardInventoryId, cardId, serialNumber, toUserId } = (await req.json()) as {
      cardInventoryId?: string;
      cardId?: string;
      serialNumber?: number | null;
      toUserId?: string;
    };

    if ((!cardInventoryId && !cardId) || !toUserId) {
      return NextResponse.json({ error: "送付するカード情報が不足しています" }, { status: 400 });
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

    const inventoryRow = await findInventoryRow({
      supabase,
      cardInventoryId,
      cardId,
      serialNumber,
      userId: fromUserId,
    });

    if (!inventoryRow) {
      return NextResponse.json({ error: "カードが見つからないか、あなたの所有ではありません" }, { status: 404 });
    }

    // カード情報を取得
    const card = await fetchCardById(supabase, inventoryRow.card_id);

    // 送信者がこのカードの他のコピーを持っているかチェック
    const { count: senderOtherCopies } = await supabase
      .from("card_inventory")
      .select("id", { count: "exact", head: true })
      .eq("app_user_id", fromUserId)
      .eq("card_id", inventoryRow.card_id)
      .neq("id", inventoryRow.id);

    // 受信者が既にこのカードを持っているかチェック
    const { count: receiverExistingCopies } = await supabase
      .from("card_inventory")
      .select("id", { count: "exact", head: true })
      .eq("app_user_id", toUserId)
      .eq("card_id", inventoryRow.card_id);

    const { error: updateError } = await supabase
      .from("card_inventory")
      .update({ app_user_id: toUserId, obtained_at: new Date().toISOString() })
      .eq("id", inventoryRow.id)
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

    // 送信者のキャッシュからカードを削除
    const senderDistinctDelta = (senderOtherCopies ?? 0) > 0 ? 0 : -1;
    void emitCollectionEventToEdge(fromUserId, {
      type: 'remove',
      inventoryId: inventoryRow.id,
      totalOwnedDelta: -1,
      distinctOwnedDelta: senderDistinctDelta,
    });
    
    // 受信者のキャッシュを更新（カードを追加）
    const { data: updatedInventory } = await supabase
      .from("card_inventory")
      .select("*")
      .eq("id", inventoryRow.id)
      .single();

    if (updatedInventory) {
      const entry = buildCollectionEntryFromInventory(updatedInventory, card);
      // distinctOwnedDelta: 既に持っていれば 0、新規なら +1
      const receiverDistinctDelta = (receiverExistingCopies ?? 0) > 0 ? 0 : 1;
      
      // 受信者側にカードを追加
      void emitCollectionEventToEdge(toUserId, {
        type: 'add',
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

type FindInventoryArgs = {
  supabase: ReturnType<typeof getServiceSupabase>;
  cardInventoryId?: string;
  cardId?: string;
  serialNumber?: number | null;
  userId: string;
};

async function findInventoryRow({ supabase, cardInventoryId, cardId, serialNumber, userId }: FindInventoryArgs) {
  if (cardInventoryId) {
    const { data } = await supabase
      .from("card_inventory")
      .select("id, app_user_id, card_id, serial_number")
      .eq("id", cardInventoryId)
      .maybeSingle();
    if (data && data.app_user_id === userId) {
      return data;
    }
  }

  if (!cardId) {
    return null;
  }

  let query = supabase
    .from("card_inventory")
    .select("id, app_user_id, card_id, serial_number")
    .eq("app_user_id", userId)
    .eq("card_id", cardId)
    .order("obtained_at", { ascending: false })
    .limit(1);

  if (typeof serialNumber === "number") {
    query = query.eq("serial_number", serialNumber);
  }

  const { data } = await query.maybeSingle();
  return data ?? null;
}
