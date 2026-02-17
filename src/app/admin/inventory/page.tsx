import { AdminCard, AdminPageHero, AdminSectionTitle } from "@/components/admin/admin-ui";
import { getServiceSupabase } from "@/lib/supabase/service";

type InventoryRow = {
  id: string;
  card_id: string;
  serial_number: number;
  obtained_at: string;
  cards: {
    id: string;
    card_name: string;
    rarity: string;
    star_level: number | null;
  } | null;
  owner: {
    id: string;
    email: string | null;
    display_name: string | null;
  } | null;
};

// searchParams 型は Next.js 側で提供されるため any を許容
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    const rows = (data ?? []) as InventoryRow[];
    results = rows.map((row) => ({
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
      <AdminPageHero
        eyebrow="Inventory"
        title="カード在庫 / シリアル検索"
        description="カード名とシリアルを入力して、現在の所持者や取得履歴を特定します。"
      />

      <AdminCard>
        <AdminSectionTitle title="検索条件" description="シリアル番号は必須です" />
        <form className="mt-6 grid gap-4 md:grid-cols-3">
          <label className="text-sm md:col-span-2">
            カード名（あいまい検索）
            <input
              name="cardName"
              defaultValue={cardName}
              placeholder="例: コンビニ / 勇者 など"
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none"
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
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.03] px-3 py-2 text-sm text-white focus:border-white/60 focus:outline-none"
            />
          </label>
          <div className="md:col-span-3">
            <button className="w-full rounded-2xl bg-gradient-to-r from-[#ffd86f] to-[#ff8bd5] px-4 py-3 font-semibold text-[#0c0c0c]">
              検索する
            </button>
          </div>
        </form>
      </AdminCard>

      {serialRaw && (
        <AdminCard>
          <AdminSectionTitle title="検索結果" description={results.length ? undefined : "該当するシリアルが見つかりません"} />
          {results.length === 0 ? (
            <p className="mt-4 text-sm text-white/70">該当するシリアルが見つかりませんでした。</p>
          ) : (
            <div className="mt-6 overflow-x-auto text-sm">
              <table className="min-w-full text-left">
                <thead className="border-b border-white/10 text-xs uppercase tracking-[0.25em] text-white/60">
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
                      <td className="py-3 pr-4">
                        {row.card ? (
                          <>
                            <div className="font-medium text-white">{row.card.name}</div>
                            <div className="text-xs text-white/60">★{row.card.star_level ?? "-"}</div>
                          </>
                        ) : (
                          <span className="text-xs text-white/50">カード情報なし</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-white/80">{row.card?.rarity ?? "-"}</td>
                      <td className="py-3 pr-4 text-white">#{row.serial_number}</td>
                      <td className="py-3 pr-4">
                        {row.owner ? (
                          <>
                            <div className="font-medium text-white">{row.owner.display_name ?? row.owner.email ?? row.owner.id}</div>
                            <div className="break-all text-xs text-white/50">{row.owner.id}</div>
                          </>
                        ) : (
                          <span className="text-xs text-white/50">ユーザー情報なし</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-white/80">{new Date(row.obtained_at).toLocaleString("ja-JP")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>
      )}
    </div>
  );
}
