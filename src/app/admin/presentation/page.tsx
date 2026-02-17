import { revalidatePath } from "next/cache";

import { AdminCard, AdminPageHero, AdminSectionTitle, AdminSubCard } from "@/components/admin/admin-ui";
import { getServiceSupabase } from "@/lib/supabase/service";

type Rarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR' | 'LR';
type StandbyColor = 'black' | 'white' | 'yellow' | 'red' | 'blue' | 'rainbow';
type Grade = 'E1' | 'E2' | 'E3' | 'E4' | 'E5';

async function updateStandbyProbabilities(formData: FormData) {
  "use server";
  const supabase = getServiceSupabase();
  const rarity = formData.get("rarity") as Rarity;
  
  const probabilities = {
    black: Number(formData.get("black")),
    white: Number(formData.get("white")),
    yellow: Number(formData.get("yellow")),
    red: Number(formData.get("red")),
    blue: Number(formData.get("blue")),
    rainbow: Number(formData.get("rainbow")),
  };

  // バリデーション：合計100%チェック
  const total = Object.values(probabilities).reduce((sum, val) => sum + val, 0);
  if (Math.abs(total - 100) > 0.01) {
    throw new Error(`確率の合計が100%である必要があります（現在: ${total}%）`);
  }

  await supabase
    .from("presentation_config")
    .upsert({
      config_type: "standby_color",
      rarity,
      probabilities,
    }, {
      onConflict: "config_type,rarity",
    });

  revalidatePath("/admin/presentation");
}

async function updateCountdownProbabilities(formData: FormData) {
  "use server";
  const supabase = getServiceSupabase();
  const rarity = formData.get("rarity") as Rarity;
  
  const probabilities = {
    E1: Number(formData.get("E1")),
    E2: Number(formData.get("E2")),
    E3: Number(formData.get("E3")),
    E4: Number(formData.get("E4")),
    E5: Number(formData.get("E5")),
  };

  // バリデーション：合計100%チェック
  const total = Object.values(probabilities).reduce((sum, val) => sum + val, 0);
  if (Math.abs(total - 100) > 0.01) {
    throw new Error(`確率の合計が100%である必要があります（現在: ${total}%）`);
  }

  await supabase
    .from("presentation_config")
    .upsert({
      config_type: "countdown_grade",
      rarity,
      probabilities,
    }, {
      onConflict: "config_type,rarity",
    });

  revalidatePath("/admin/presentation");
}

async function updateTitleHintRate(formData: FormData) {
  "use server";
  const supabase = getServiceSupabase();
  const hintRate = Number(formData.get("hintRate"));

  if (hintRate < 0 || hintRate > 100) {
    throw new Error("ヒント確率は0〜100%の範囲で指定してください");
  }

  await supabase
    .from("presentation_config")
    .upsert({
      config_type: "title_hint",
      rarity: "ALL" as Rarity,
      probabilities: { hintRate },
    }, {
      onConflict: "config_type,rarity",
    });

  revalidatePath("/admin/presentation");
}

export default async function PresentationPage() {
  const supabase = getServiceSupabase();
  
  // 既存設定を取得
  const { data: standbyConfigs } = await supabase
    .from("presentation_config")
    .select("*")
    .eq("config_type", "standby_color");

  const { data: countdownConfigs } = await supabase
    .from("presentation_config")
    .select("*")
    .eq("config_type", "countdown_grade");

  const { data: titleConfig } = await supabase
    .from("presentation_config")
    .select("*")
    .eq("config_type", "title_hint")
    .single();

  const rarities: Rarity[] = ['N', 'R', 'SR', 'SSR', 'UR', 'LR'];
  const standbyColors: StandbyColor[] = ['black', 'white', 'yellow', 'red', 'blue', 'rainbow'];
  const grades: Grade[] = ['E1', 'E2', 'E3', 'E4', 'E5'];

  return (
    <div className="space-y-8">
      <AdminPageHero
        eyebrow="Presentation"
        title="演出確率設定"
        description="STANDBY色、カウントダウン、タイトルヒントの確率をコントロールします。"
      />

      <AdminCard>
        <AdminSectionTitle title="タイトル動画ヒント率" description="実際のカードタイトル動画を表示する確率" />
        <form action={updateTitleHintRate} className="mt-6 space-y-4">
          <label className="block text-sm">
            ヒント確率 (%)
            <input
              type="number"
              name="hintRate"
              min="0"
              max="100"
              step="1"
              defaultValue={
                typeof titleConfig?.probabilities === 'object' &&
                titleConfig?.probabilities &&
                'hintRate' in titleConfig.probabilities
                  ? Number(titleConfig.probabilities.hintRate)
                  : 60
              }
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.03] px-4 py-2 text-white focus:border-white/60 focus:outline-none"
            />
          </label>
          <button className="rounded-2xl bg-gradient-to-r from-[#7efde5] to-[#4dd8ff] px-6 py-2 font-semibold text-[#050505]">
            保存
          </button>
        </form>
      </AdminCard>

      <AdminCard>
        <AdminSectionTitle title="STANDBY色の確率" description="各レア度で6色の出現比率を調整" />
        <div className="mt-6 space-y-4">
          {rarities.map((rarity) => {
            const config = standbyConfigs?.find((c) => c.rarity === rarity);
            const probs = (config?.probabilities as Record<string, number>) ?? {};
            return (
              <AdminSubCard key={rarity}>
                <form action={updateStandbyProbabilities} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">レア度: {rarity}</h3>
                  </div>
                  <input type="hidden" name="rarity" value={rarity} />
                  <div className="grid gap-3 md:grid-cols-3">
                    {standbyColors.map((color) => (
                      <label key={color} className="block text-sm">
                        {color}
                        <input
                          type="number"
                          name={color}
                          min="0"
                          max="100"
                          step="0.1"
                          defaultValue={probs[color] ?? 0}
                          className="mt-1 w-full rounded-xl border border-white/15 bg-white/[0.03] px-2 py-1 text-xs text-white focus:border-white/60"
                        />
                      </label>
                    ))}
                  </div>
                  <button className="w-full rounded-xl bg-gradient-to-r from-[#6dd5ff] to-[#5efce8] px-4 py-2 text-sm font-semibold text-[#04231c]">
                    保存
                  </button>
                </form>
              </AdminSubCard>
            );
          })}
        </div>
      </AdminCard>

      <AdminCard>
        <AdminSectionTitle title="カウントダウングレードの確率" description="グレードE1〜E5の比率" />
        <div className="mt-6 space-y-4">
          {rarities.map((rarity) => {
            const config = countdownConfigs?.find((c) => c.rarity === rarity);
            const probs = (config?.probabilities as Record<string, number>) ?? {};
            return (
              <AdminSubCard key={rarity}>
                <form action={updateCountdownProbabilities} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">レア度: {rarity}</h3>
                  </div>
                  <input type="hidden" name="rarity" value={rarity} />
                  <div className="grid gap-3 md:grid-cols-5">
                    {grades.map((grade) => (
                      <label key={grade} className="block text-sm">
                        {grade}
                        <input
                          type="number"
                          name={grade}
                          min="0"
                          max="100"
                          step="0.1"
                          defaultValue={probs[grade] ?? 0}
                          className="mt-1 w-full rounded-xl border border-white/15 bg-white/[0.03] px-2 py-1 text-xs text-white focus:border-white/60"
                        />
                      </label>
                    ))}
                  </div>
                  <button className="w-full rounded-xl bg-gradient-to-r from-[#6dd5ff] to-[#5efce8] px-4 py-2 text-sm font-semibold text-[#04231c]">
                    保存
                  </button>
                </form>
              </AdminSubCard>
            );
          })}
        </div>
      </AdminCard>
    </div>
  );
}
