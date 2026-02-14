import { getServiceSupabase } from "@/lib/supabase/service";

export default async function InventoryAdminPage({ searchParams }: any) {
  const supabase = getServiceSupabase();

  const cardName = (searchParams?.cardName ?? "").toString().trim();
  const serialRaw = (searchParams?.serial ?? "").toString().trim();
  const serial = serialRaw ? Number(serialRaw) : NaN;

  let results: {
    id: string;
    serial_number: number;
    obtained_at: string;
    card: { id: string; name: string; rarity: string; star_level: number | null } | null;
    owner: { id: string; email: string | null; display_name: string | null } | null;
  }[] = [];

  if (serialRaw && !Number.isNaN(serial)) {
    let cardIds: string[] | null = null;
    if (cardName) {
      const { data: cardsData, error: cardsError } = await supabase
        .from("cards")
        .select("id")
        .ilike("card_name", `%${cardName}%`);
      if (cardsError) {
        throw new Error(cardsError.message);
      }
      cardIds = (cardsData ?? []).map((c) => c.id);
      if (!cardIds.length) {
        cardIds = [];
      }
    }

    let query = supabase
      .from("card_inventory")
      .select(
        `id, card_id, serial_number, obtained_at,
         cards:card_inventory_card_id_fkey (id, card_name, rarity, star_level),
         owner:card_inventory_app_user_id_fkey (id, email, display_name)`
      )
      .eq("serial_number", serial)
      .order("obtained_at", { ascending: false })
      .limit(50);

    if (cardIds && cardIds.length) {
      query = query.in("card_id", cardIds);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    results = (data ?? []).map((row: any) => ({
      id: row.id as string,
      serial_number: row.serial_number as number,
      obtained_at: row.obtained_at as string,
      card: row.cards
        ? {
            id: row.cards.id as string,
            name: row.cards.card_name as string,
            rarity: row.cards.rarity as string,
            star_level: (row.cards.star_level as number | null) ?? null,
          }
        : null,
      owner: row.owner
        ? {
            id: row.owner.id as string,
            email: (row.owner.email as string | null) ?? null,
            display_name: (row.owner.display_name as string | null) ?? null,
          }
        : null,
    }));
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">カード在庫 / シリアル検索</h1>
        <p className="text-sm text-slate-300">カードIDとシリアルナンバーから、現在の所持者を特定します。</p>
      </header>

      <section className="rounded-3xl bg-white/10 p-5">
        <form className="grid gap-4 md:grid-cols-3">
          <label className="text-sm md:col-span-2">
            カード名（あいまい検索）
            <input
              name="cardName"
              defaultValue={cardName}
              placeholder="例: コンビニ / 勇者 など"
              className="mt-1 w-full rounded-2xl bg-white/10 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            シリアル番号（必須）
            <input
              name="serial"
              type="number"
              min={1}
              defaultValue={serialRaw}
              required
              className="mt-1 w-full rounded-2xl bg-white/10 px-3 py-2"
            />
          </label>
          <div className="md:col-span-3">
            <button className="w-full rounded-2xl bg-rose-400/80 px-4 py-3 font-semibold text-slate-950">
              検索する
            </button>
          </div>
        </form>
      </section>

      {serialRaw && (
        <section className="rounded-3xl bg-white/10 p-5">
          <h2 className="text-xl font-semibold">検索結果</h2>
          {results.length === 0 ? (
            <p className="mt-3 text-sm text-slate-200">該当するシリアルが見つかりませんでした。</p>
          ) : (
            <div className="mt-4 overflow-x-auto text-sm">
              <table className="min-w-full text-left">
                <thead className="border-b border-white/10 text-xs uppercase tracking-[0.25em] text-slate-300">
                  <tr>
                    <th className="py-2 pr-4">カード</th>
                    <th className="py-2 pr-4">レア</th>
                    <th className="py-2 pr-4">シリアル</th>
                    <th className="py-2 pr-4">所持者</th>
                    <th className="py-2 pr-4">取得日時</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((row) => (
                    <tr key={row.id} className="border-b border-white/5 last:border-0">
                      <td className="py-2 pr-4">
                        {row.card ? (
                          <>
                            <div className="font-medium">{row.card.name}</div>
                            <div className="text-xs text-slate-300">★{row.card.star_level ?? "-"}</div>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">カード情報なし</span>
                        )}
                      </td>
                      <td className="py-2 pr-4">{row.card?.rarity ?? "-"}</td>
                      <td className="py-2 pr-4">#{row.serial_number}</td>
                      <td className="py-2 pr-4">
                        {row.owner ? (
                          <>
                            <div className="font-medium">{row.owner.display_name ?? row.owner.email ?? row.owner.id}</div>
                            <div className="text-xs text-slate-400 break-all">{row.owner.id}</div>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">ユーザー情報なし</span>
                        )}
                      </td>
                      <td className="py-2 pr-4">{new Date(row.obtained_at).toLocaleString("ja-JP")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
