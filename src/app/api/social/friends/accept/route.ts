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

    const { requestId } = (await req.json()) as { requestId?: string };
    if (!requestId) {
      return NextResponse.json({ error: "requestId is required" }, { status: 400 });
    }

    const userId = context.user.id;

    const { data: requestRow, error: requestError } = await supabase
      .from("friend_requests")
      .select("id, from_user_id, to_user_id, status")
      .eq("id", requestId)
      .single();

    if (requestError || !requestRow) {
      return NextResponse.json({ error: "リクエストが見つかりません" }, { status: 404 });
    }
    if (requestRow.to_user_id !== userId) {
      return NextResponse.json({ error: "このリクエストを承認する権限がありません" }, { status: 403 });
    }
    if (requestRow.status === "accepted") {
      return NextResponse.json({ ok: true, status: "already_accepted" });
    }

    const now = new Date().toISOString();
    await supabase
      .from("friend_requests")
      .update({ status: "accepted", resolved_at: now })
      .eq("id", requestRow.id);

    await Promise.all([
      supabase
        .from("friends")
        .upsert({ user_id: requestRow.from_user_id, friend_user_id: requestRow.to_user_id }, { onConflict: "user_id,friend_user_id" }),
      supabase
        .from("friends")
        .upsert({ user_id: requestRow.to_user_id, friend_user_id: requestRow.from_user_id }, { onConflict: "user_id,friend_user_id" }),
    ]);

    return NextResponse.json({ ok: true, status: "accepted" });
  } catch (error) {
    console.error("friend accept error", error);
    return NextResponse.json({ error: "フレンド承認に失敗しました" }, { status: 500 });
  }
}
