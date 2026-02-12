import { revalidatePath } from "next/cache";

import { fetchAllCharacters } from "@/lib/data/gacha";
import { getServiceSupabase } from "@/lib/supabase/service";

async function addCharacter(formData: FormData) {
  "use server";
  const supabase = getServiceSupabase();
  const payload = {
    name: String(formData.get("name")),
    description: String(formData.get("description") ?? ""),
    expectation_level: Number(formData.get("expectation") ?? 1),
    thumbnail_url: String(formData.get("thumbnail") ?? "/placeholders/kenta-thumb.svg"),
    sort_order: Number(formData.get("sortOrder") ?? 0),
    is_active: formData.get("isActive") === "on",
  };
  await supabase.from("characters").insert(payload);
  revalidatePath("/admin/characters");
}

async function toggleCharacter(formData: FormData) {
  "use server";
  const supabase = getServiceSupabase();
  const id = String(formData.get("id"));
  const nextState = formData.get("nextState") === "true";
  await supabase.from("characters").update({ is_active: nextState }).eq("id", id);
  revalidatePath("/admin/characters");
}

export default async function CharacterAdminPage() {
  const supabase = getServiceSupabase();
  const characters = await fetchAllCharacters(supabase);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold">キャラクター一覧</h1>
        <div className="mt-4 space-y-3">
          {characters.map((character) => (
            <div key={character.id} className="flex items-center justify-between rounded-2xl bg-white/10 p-4">
              <div>
                <p className="text-lg font-semibold">{character.name}</p>
                <p className="text-sm text-slate-300">期待度 {character.expectation_level}</p>
              </div>
              <form action={toggleCharacter}>
                <input type="hidden" name="id" value={character.id} />
                <input type="hidden" name="nextState" value={(!character.is_active).toString()} />
                <button className="rounded-full border border-white/40 px-4 py-2 text-sm">
                  {character.is_active ? "非公開にする" : "公開する"}
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-white/10 p-6">
        <h2 className="text-xl font-semibold">キャラクター追加</h2>
        <form action={addCharacter} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            名前
            <input name="name" required className="mt-1 w-full rounded-2xl bg-white/10 px-3 py-2" />
          </label>
          <label className="text-sm">
            期待度 (1-12)
            <input type="number" name="expectation" min={1} max={12} defaultValue={1} className="mt-1 w-full rounded-2xl bg-white/10 px-3 py-2" />
          </label>
          <label className="text-sm">
            サムネイルURL
            <input name="thumbnail" className="mt-1 w-full rounded-2xl bg-white/10 px-3 py-2" placeholder="/placeholders/kenta-thumb.svg" />
          </label>
          <label className="text-sm">
            並び順
            <input type="number" name="sortOrder" defaultValue={0} className="mt-1 w-full rounded-2xl bg-white/10 px-3 py-2" />
          </label>
          <label className="text-sm sm:col-span-2">
            説明
            <textarea name="description" rows={3} className="mt-1 w-full rounded-2xl bg-white/10 px-3 py-2" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4" /> 公開する
          </label>
          <div className="sm:col-span-2">
            <button className="w-full rounded-2xl bg-emerald-400/80 px-4 py-3 font-semibold text-slate-950">
              追加する
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
