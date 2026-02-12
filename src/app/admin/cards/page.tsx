import { revalidatePath } from "next/cache";

import { fetchAllCards, fetchAllCharacters } from "@/lib/data/gacha";
import { getServiceSupabase } from "@/lib/supabase/service";
import type { TablesInsert } from "@/types/database";

async function addCard(formData: FormData) {
  "use server";
  const supabase = getServiceSupabase();
  const payload: TablesInsert<"cards"> = {
    card_name: String(formData.get("name")),
    character_id: String(formData.get("character")),
    star_level: Number(formData.get("star")),
    rarity: (formData.get("rarity") as TablesInsert<"cards">["rarity"]) ?? "N",
    card_image_url: (formData.get("image") as string) || "/placeholders/card-default.svg",
    description: (formData.get("description") as string) || null,
    has_reversal: formData.get("hasReversal") === "on",
    sort_order: Number(formData.get("sortOrder") ?? 0),
    is_active: true,
  };
  await supabase.from("cards").insert(payload);
  revalidatePath("/admin/cards");
}

export default async function CardAdminPage() {
  const supabase = getServiceSupabase();
  const [cards, characters] = await Promise.all([
    fetchAllCards(supabase),
    fetchAllCharacters(supabase),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold">カード一覧</h1>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {cards.map((card) => (
            <article key={card.id} className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-300">{card.rarity}</p>
              <h2 className="text-xl font-semibold">{card.card_name}</h2>
              <p className="text-sm text-slate-300">★{card.star_level}</p>
              <p className="text-xs text-slate-400">
                キャラクター: {characters.find((c) => c.id === card.character_id)?.name ?? "Unknown"}
              </p>
              <p className="mt-2 text-sm text-slate-200">{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-white/10 p-6">
        <h2 className="text-xl font-semibold">カード追加</h2>
        <form action={addCard} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            カード名
            <input name="name" required className="mt-1 w-full rounded-2xl bg-white/10 px-3 py-2" />
          </label>
          <label className="text-sm">
            キャラクター
            <select name="character" className="mt-1 w-full rounded-2xl bg-white/10 px-3 py-2">
              {characters.map((character) => (
                <option key={character.id} value={character.id}>
                  {character.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            星
            <input type="number" name="star" min={1} max={12} defaultValue={1} className="mt-1 w-full rounded-2xl bg-white/10 px-3 py-2" />
          </label>
          <label className="text-sm">
            レアリティ
            <select name="rarity" className="mt-1 w-full rounded-2xl bg-white/10 px-3 py-2">
              {['N','R','SR','SSR','UR','LR'].map((rarity) => (
                <option key={rarity} value={rarity}>
                  {rarity}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            画像URL
            <input name="image" placeholder="/placeholders/card-default.svg" className="mt-1 w-full rounded-2xl bg-white/10 px-3 py-2" />
          </label>
          <label className="text-sm">
            並び順
            <input type="number" name="sortOrder" defaultValue={0} className="mt-1 w-full rounded-2xl bg-white/10 px-3 py-2" />
          </label>
          <label className="text-sm md:col-span-2">
            説明
            <textarea name="description" rows={3} className="mt-1 w-full rounded-2xl bg-white/10 px-3 py-2" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="hasReversal" className="h-4 w-4" /> どんでん返し動画あり
          </label>
          <div className="md:col-span-2">
            <button className="w-full rounded-2xl bg-rose-400/80 px-4 py-3 font-semibold text-slate-950">
              追加する
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
