import { NextResponse } from "next/server";

import { fetchAuthedContext } from "@/lib/app/session";
import { getServiceSupabase } from "@/lib/supabase/service";
import { fetchTransactionHistory } from "@/lib/data/transactions";

export async function GET(request: Request) {
  try {
    const supabase = getServiceSupabase();
    const context = await fetchAuthedContext(supabase);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : undefined;

    const payload = await fetchTransactionHistory(supabase, context.user.id, { limit });
    return NextResponse.json(payload);
  } catch (error) {
    console.error("transactions api error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "履歴を取得できませんでした。" },
      { status: 500 },
    );
  }
}
