import { revalidatePath } from "next/cache";

import { fetchGachaConfig } from "@/lib/data/gacha";
import { getServiceSupabase } from "@/lib/supabase/service";

async function updateConfig(formData: FormData) {
  "use server";
  const supabase = getServiceSupabase();
  const slug = "default";

  const rtpText = String(formData.get("rtp"));
  const reversalText = String(formData.get("reversal"));
  const weightText = String(formData.get("weights"));

  let rtp;
  let reversal;
  let weights;

  try {
    rtp = JSON.parse(rtpText);
    reversal = JSON.parse(reversalText);
    weights = JSON.parse(weightText);
  } catch (error) {
    console.error("invalid config json", error);
    throw new Error("JSONの形式が正しくありません");
  }

  await supabase
    .from("gacha_config")
    .update({
      rtp_config: rtp,
      reversal_rates: reversal,
      character_weights: weights,
    })
    .eq("slug", slug);

  revalidatePath("/admin/settings");
}

export default async function SettingsPage() {
  const supabase = getServiceSupabase();
  const config = await fetchGachaConfig(supabase);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">ガチャ設定</h1>
        <p className="text-sm text-slate-300">JSON編集でRTPやレートを調整できます。</p>
      </header>
      <form action={updateConfig} className="space-y-4">
        <label className="block text-sm">
          RTP設定
          <textarea
            name="rtp"
            rows={6}
            defaultValue={JSON.stringify(config.rtp, null, 2)}
            className="mt-1 w-full rounded-2xl bg-white/10 px-3 py-2 font-mono text-xs"
          />
        </label>
        <label className="block text-sm">
          リバーサル率
          <textarea
            name="reversal"
            rows={4}
            defaultValue={JSON.stringify(config.reversalRates, null, 2)}
            className="mt-1 w-full rounded-2xl bg-white/10 px-3 py-2 font-mono text-xs"
          />
        </label>
        <label className="block text-sm">
          キャラクター比率
          <textarea
            name="weights"
            rows={4}
            defaultValue={JSON.stringify(config.characterWeights, null, 2)}
            className="mt-1 w-full rounded-2xl bg-white/10 px-3 py-2 font-mono text-xs"
          />
        </label>
        <button className="w-full rounded-2xl bg-emerald-400/80 px-4 py-3 font-semibold text-slate-950">
          保存する
        </button>
      </form>
    </div>
  );
}
