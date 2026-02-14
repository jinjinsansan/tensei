import { revalidatePath } from "next/cache";

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
      <header>
        <h1 className="text-2xl font-bold">演出確率設定</h1>
        <p className="text-sm text-slate-300">STANDBY色、カウントダウングレード、タイトル動画ヒント率を調整します。</p>
      </header>

      {/* タイトル動画ヒント率 */}
      <section className="space-y-4 rounded-3xl border border-white/15 bg-white/5 p-6">
        <h2 className="text-xl font-semibold">タイトル動画ヒント率</h2>
        <p className="text-sm text-slate-300">実際のカードのタイトル動画を表示する確率（60%推奨）</p>
        <form action={updateTitleHintRate} className="space-y-4">
          <label className="block">
            <span className="text-sm">ヒント確率 (%)</span>
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
              className="mt-1 w-full rounded-2xl bg-white/10 px-4 py-2"
            />
          </label>
          <button className="rounded-2xl bg-emerald-400/80 px-6 py-2 font-semibold text-slate-950">
            保存
          </button>
        </form>
      </section>

      {/* STANDBY色確率 */}
      <section className="space-y-4 rounded-3xl border border-white/15 bg-white/5 p-6">
        <h2 className="text-xl font-semibold">STANDBY色の確率</h2>
        <p className="text-sm text-slate-300">各レア度ごとに6色の出現確率を設定（合計100%）</p>
        {rarities.map((rarity) => {
          const config = standbyConfigs?.find((c) => c.rarity === rarity);
          const probs = (config?.probabilities as Record<string, number>) ?? {};
          return (
            <form key={rarity} action={updateStandbyProbabilities} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold">レア度: {rarity}</h3>
              <input type="hidden" name="rarity" value={rarity} />
              <div className="grid grid-cols-3 gap-3">
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
                      className="mt-1 w-full rounded-xl bg-white/10 px-2 py-1 text-xs"
                    />
                  </label>
                ))}
              </div>
              <button className="w-full rounded-xl bg-blue-400/80 px-4 py-2 text-sm font-semibold text-slate-950">
                保存
              </button>
            </form>
          );
        })}
      </section>

      {/* カウントダウングレード確率 */}
      <section className="space-y-4 rounded-3xl border border-white/15 bg-white/5 p-6">
        <h2 className="text-xl font-semibold">カウントダウングレードの確率</h2>
        <p className="text-sm text-slate-300">各レア度ごとに5グレードの出現確率を設定（合計100%）</p>
        {rarities.map((rarity) => {
          const config = countdownConfigs?.find((c) => c.rarity === rarity);
          const probs = (config?.probabilities as Record<string, number>) ?? {};
          return (
            <form key={rarity} action={updateCountdownProbabilities} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold">レア度: {rarity}</h3>
              <input type="hidden" name="rarity" value={rarity} />
              <div className="grid grid-cols-5 gap-3">
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
                      className="mt-1 w-full rounded-xl bg-white/10 px-2 py-1 text-xs"
                    />
                  </label>
                ))}
              </div>
              <button className="w-full rounded-xl bg-blue-400/80 px-4 py-2 text-sm font-semibold text-slate-950">
                保存
              </button>
            </form>
          );
        })}
      </section>
    </div>
  );
}
