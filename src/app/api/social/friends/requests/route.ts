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

    const userId = context.user.id;

    const { data: requestRows, error: reqError } = await supabase
      .from("friend_requests")
      .select("id, from_user_id, to_user_id, status, created_at")
      .eq("to_user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (reqError) {
      throw new Error(reqError.message);
    }

    const fromIds = (requestRows ?? []).map((row) => row.from_user_id);
    const { data: usersData, error: usersError } = await supabase
      .from("app_users")
      .select("id, email, display_name")
      .in("id", fromIds.length ? fromIds : ["00000000-0000-0000-0000-000000000000"]);

    if (usersError) {
      throw new Error(usersError.message);
    }

    const requests = (requestRows ?? []).map((row) => {
      const user = usersData!.find((u) => u.id === row.from_user_id);
      return {
        id: row.id,
        from_user_id: row.from_user_id,
        created_at: row.created_at,
        from_display_name: user?.display_name ?? null,
        from_email: user?.email ?? null,
      };
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("friend requests error", error);
    return NextResponse.json({ error: "フレンド申請一覧の取得に失敗しました" }, { status: 500 });
  }
}
