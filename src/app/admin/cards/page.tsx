import { revalidatePath } from "next/cache";

import { AdminCard, AdminPageHero, AdminSectionTitle, AdminSubCard } from "@/components/admin/admin-ui";
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
    <div className="space-y-6">
      <AdminPageHero
        eyebrow="Cards"
        title="カード管理"
        description="カードセットの概要と新規カードの追加を行います。"
      />

      <AdminCard>
        <AdminSectionTitle title="カード一覧" description="現在登録されているカードのステータス" />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {cards.map((card) => (
            <AdminSubCard key={card.id}>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">{card.rarity}</p>
              <h2 className="mt-2 text-xl font-semibold text-white">{card.card_name}</h2>
              <p className="text-sm text-white/70">★{card.star_level}</p>
              <p className="text-xs text-white/60">
                キャラクター: {characters.find((c) => c.id === card.character_id)?.name ?? "Unknown"}
              </p>
              <p className="mt-2 text-sm text-white/70">{card.description}</p>
            </AdminSubCard>
          ))}
        </div>
      </AdminCard>

      <AdminCard>
        <AdminSectionTitle title="カード追加" description="フォームを埋めてカードを登録します" />
        <form action={addCard} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            カード名
            <input name="name" required className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.03] px-3 py-2 text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none" />
          </label>
          <label className="text-sm">
            キャラクター
            <select
              name="character"
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-white/60"
            >
              {characters.map((character) => (
                <option key={character.id} value={character.id}>
                  {character.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            星
            <input type="number" name="star" min={1} max={12} defaultValue={1} className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.03] px-3 py-2 text-white focus:border-white/60 focus:outline-none" />
          </label>
          <label className="text-sm">
            レアリティ
            <select
              name="rarity"
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-white/60"
            >
              {['N','R','SR','SSR','UR','LR'].map((rarity) => (
                <option key={rarity} value={rarity}>
                  {rarity}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            画像URL
            <input name="image" placeholder="/placeholders/card-default.svg" className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.03] px-3 py-2 text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none" />
          </label>
          <label className="text-sm">
            並び順
            <input type="number" name="sortOrder" defaultValue={0} className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.03] px-3 py-2 text-white focus:border-white/60 focus:outline-none" />
          </label>
          <label className="text-sm md:col-span-2">
            説明
            <textarea name="description" rows={3} className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.03] px-3 py-2 text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="hasReversal" className="h-4 w-4 rounded border-white/30 bg-transparent" /> どんでん返し動画あり
          </label>
          <div className="md:col-span-2">
            <button className="w-full rounded-2xl bg-gradient-to-r from-[#ffd86f] to-[#ff8bd5] px-4 py-3 font-semibold text-slate-950">
              追加する
            </button>
          </div>
        </form>
      </AdminCard>
    </div>
  );
}
