import { revalidatePath } from "next/cache";

import { AdminCard, AdminPageHero, AdminSectionTitle, AdminSubCard } from "@/components/admin/admin-ui";
import { fetchAllCards, fetchAllScenarios } from "@/lib/data/gacha";
import { getServiceSupabase } from "@/lib/supabase/service";
import type { TablesInsert } from "@/types/database";

const phases = [
  { value: "pre_story", label: "プレストーリー" },
  { value: "chance", label: "チャンス" },
  { value: "main_story", label: "メイン" },
  { value: "reversal", label: "どんでん返し" },
];

const telops = ["neutral", "chance", "win", "lose", "reversal", "epic"] as const;

async function addScenario(formData: FormData) {
  "use server";
  const supabase = getServiceSupabase();
  const telopInput = formData.get("telop");
  const videoInput = formData.get("video") as string;

  const payload: TablesInsert<"scenarios"> = {
    card_id: String(formData.get("card")),
    phase: (formData.get("phase") as TablesInsert<"scenarios">["phase"]) ?? "main_story",
    scene_order: Number(formData.get("order") ?? 0),
    video_url: videoInput || null,
    duration_seconds: Number(formData.get("duration") ?? 6),
    telop_text: telopInput ? String(telopInput) : null,
    telop_type: (formData.get("telopType") as TablesInsert<"scenarios">["telop_type"]) ?? "neutral",
  };
  await supabase.from("scenarios").insert(payload);
  revalidatePath("/admin/scenarios");
}

export default async function ScenarioAdminPage() {
  const supabase = getServiceSupabase();
  const [cards, scenarios] = await Promise.all([
    fetchAllCards(supabase),
    fetchAllScenarios(supabase),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHero
        eyebrow="Scenarios"
        title="シナリオ管理"
        description="カードごとの動画シーケンスとテロップを管理します。"
      />

      <AdminCard>
        <AdminSectionTitle title="登録済みカード" description="各カードのシーン構成" />
        <div className="mt-6 space-y-4">
          {cards.map((card) => (
            <AdminSubCard key={card.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/60">{card.rarity}</p>
                  <h2 className="text-xl font-semibold text-white">{card.card_name}</h2>
                  <p className="text-sm text-white/70">★{card.star_level}</p>
                </div>
                <span className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.03] px-3 py-1 text-xs text-white/70">
                  {scenarios.filter((scene) => scene.card_id === card.id).length} scenes
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/70">
                {scenarios
                  .filter((scene) => scene.card_id === card.id)
                  .map((scene) => (
                    <span key={scene.id} className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1">
                      {scene.phase} #{scene.scene_order}
                    </span>
                  ))}
                {!scenarios.some((scene) => scene.card_id === card.id) && <span className="text-white/50">未登録</span>}
              </div>
            </AdminSubCard>
          ))}
        </div>
      </AdminCard>

      <AdminCard>
        <AdminSectionTitle title="シーン追加" description="カードの任意フェーズに映像を追加" />
        <form action={addScenario} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            カード
            <select
              name="card"
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.03] px-3 py-2 text-white focus:border-white/60"
            >
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.card_name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            フェーズ
            <select
              name="phase"
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.03] px-3 py-2 text-white focus:border-white/60"
            >
              {phases.map((phase) => (
                <option key={phase.value} value={phase.value}>
                  {phase.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            シーン順
            <input type="number" name="order" defaultValue={0} className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.03] px-3 py-2 text-white focus:border-white/60 focus:outline-none" />
          </label>
          <label className="text-sm">
            再生時間(秒)
            <input type="number" name="duration" defaultValue={6} className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.03] px-3 py-2 text-white focus:border-white/60 focus:outline-none" />
          </label>
          <label className="text-sm">
            動画URL
            <input name="video" required className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.03] px-3 py-2 text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none" />
          </label>
          <label className="text-sm">
            テロップ
            <input name="telop" className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.03] px-3 py-2 text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none" />
          </label>
          <label className="text-sm">
            テロップタイプ
            <select
              name="telopType"
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.03] px-3 py-2 text-white focus:border-white/60"
            >
              {telops.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <div className="md:col-span-2">
            <button className="w-full rounded-2xl bg-gradient-to-r from-[#ffd86f] to-[#ff8bd5] px-4 py-3 font-semibold text-[#0c0c0c]">
              追加する
            </button>
          </div>
        </form>
      </AdminCard>
    </div>
  );
}
