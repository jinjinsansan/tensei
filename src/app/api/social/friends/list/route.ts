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

    const { data: friendRows, error: friendsError } = await supabase
      .from("friends")
      .select("friend_user_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (friendsError) {
      throw new Error(friendsError.message);
    }

    const friendIds = (friendRows ?? []).map((row) => row.friend_user_id);
    if (!friendIds.length) {
      return NextResponse.json({ friends: [] });
    }

    const { data: usersData, error: usersError } = await supabase
      .from("app_users")
      .select("id, email, display_name")
      .in("id", friendIds);

    if (usersError) {
      throw new Error(usersError.message);
    }

    const friends = friendRows!.map((row) => {
      const user = usersData!.find((u) => u.id === row.friend_user_id);
      return {
        id: row.friend_user_id,
        display_name: user?.display_name ?? null,
        email: user?.email ?? null,
        created_at: row.created_at,
      };
    });

    return NextResponse.json({ friends });
  } catch (error) {
    console.error("friend list error", error);
    return NextResponse.json({ error: "フレンド一覧の取得に失敗しました" }, { status: 500 });
  }
}
