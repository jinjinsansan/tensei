import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import { fetchAuthedContext } from "@/lib/app/session";

export async function GET() {
  const supabase = getServiceSupabase();
  const context = await fetchAuthedContext(supabase);
  
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error: historyError } = await supabase
    .from("gacha_results")
    .select(
      `id, created_at, obtained_via,
       cards (name, rarity),
       gachas (name, ticket_types (code, name))
      `
    )
    .eq("app_user_id", context.user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (historyError) {
    return NextResponse.json({ error: historyError.message }, { status: 500 });
  }

  return NextResponse.json({ history: data ?? [] });
}
