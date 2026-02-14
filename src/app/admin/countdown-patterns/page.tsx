import { revalidatePath } from "next/cache";

import { getServiceSupabase } from "@/lib/supabase/service";

type CdColor = 'green' | 'blue' | 'red' | 'rainbow';
type Grade = 'E1' | 'E2' | 'E3' | 'E4' | 'E5';

async function togglePattern(formData: FormData) {
  "use server";
  const supabase = getServiceSupabase();
  const patternId = formData.get("patternId") as string;
  const isActive = formData.get("isActive") === "true";

  await supabase
    .from("countdown_patterns")
    .update({ is_active: !isActive })
    .eq("pattern_id", patternId);

  revalidatePath("/admin/countdown-patterns");
}

async function updatePattern(formData: FormData) {
  "use server";
  const supabase = getServiceSupabase();
  const patternId = formData.get("patternId") as string;
  const name = formData.get("name") as string;
  const grade = formData.get("grade") as Grade;

  const steps = [
    {
      number: Number(formData.get("step1_number")),
      color: formData.get("step1_color") as CdColor,
    },
    {
      number: Number(formData.get("step2_number")),
      color: formData.get("step2_color") as CdColor,
    },
    {
      number: Number(formData.get("step3_number")),
      color: formData.get("step3_color") as CdColor,
    },
    {
      number: Number(formData.get("step4_number")),
      color: formData.get("step4_color") as CdColor,
    },
  ];

  await supabase
    .from("countdown_patterns")
    .update({
      name,
      grade,
      steps,
    })
    .eq("pattern_id", patternId);

  revalidatePath("/admin/countdown-patterns");
}

async function createPattern(formData: FormData) {
  "use server";
  const supabase = getServiceSupabase();
  const patternId = formData.get("patternId") as string;
  const name = formData.get("name") as string;
  const grade = formData.get("grade") as Grade;

  const steps = [
    {
      number: Number(formData.get("step1_number")),
      color: formData.get("step1_color") as CdColor,
    },
    {
      number: Number(formData.get("step2_number")),
      color: formData.get("step2_color") as CdColor,
    },
    {
      number: Number(formData.get("step3_number")),
      color: formData.get("step3_color") as CdColor,
    },
    {
      number: Number(formData.get("step4_number")),
      color: formData.get("step4_color") as CdColor,
    },
  ];

  await supabase
    .from("countdown_patterns")
    .insert({
      pattern_id: patternId,
      name,
      grade,
      steps,
      is_active: true,
    });

  revalidatePath("/admin/countdown-patterns");
}

export default async function CountdownPatternsPage() {
  const supabase = getServiceSupabase();
  const { data: patterns } = await supabase
    .from("countdown_patterns")
    .select("*")
    .order("grade", { ascending: true })
    .order("pattern_id", { ascending: true });

  const colors: CdColor[] = ['green', 'blue', 'red', 'rainbow'];
  const grades: Grade[] = ['E1', 'E2', 'E3', 'E4', 'E5'];
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">カウントダウンパターン管理</h1>
        <p className="text-sm text-slate-300">既存パターンの編集、新規追加、有効/無効の切替ができます。</p>
      </header>

      {/* 新規パターン追加 */}
      <section className="rounded-3xl border border-emerald-400/30 bg-emerald-400/5 p-6">
        <h2 className="mb-4 text-xl font-semibold">新規パターン追加</h2>
        <form action={createPattern} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <label className="block text-sm">
              パターンID
              <input
                type="text"
                name="patternId"
                required
                placeholder="E1_01"
                className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              名前
              <input
                type="text"
                name="name"
                required
                placeholder="最高数字緑"
                className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              グレード
              <select name="grade" required className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2">
                {grades.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs font-semibold">ステップ{step}</p>
                <label className="block text-xs">
                  数字
                  <select name={`step${step}_number`} required className="mt-1 w-full rounded-lg bg-white/10 px-2 py-1 text-sm">
                    {numbers.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs">
                  色
                  <select name={`step${step}_color`} required className="mt-1 w-full rounded-lg bg-white/10 px-2 py-1 text-sm">
                    {colors.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>
            ))}
          </div>

          <button className="w-full rounded-2xl bg-emerald-400/80 px-6 py-3 font-semibold text-slate-950">
            新規パターンを追加
          </button>
        </form>
      </section>

      {/* 既存パターン一覧 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">既存パターン（{patterns?.length ?? 0}件）</h2>
        {patterns?.map((pattern) => (
          <div
            key={pattern.pattern_id}
            className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">
                  {pattern.pattern_id} - {pattern.name}
                </h3>
                <p className="text-xs text-slate-400">グレード: {pattern.grade}</p>
              </div>
              <form action={togglePattern}>
                <input type="hidden" name="patternId" value={pattern.pattern_id} />
                <input type="hidden" name="isActive" value={String(pattern.is_active)} />
                <button
                  className={`rounded-full px-4 py-1 text-xs font-semibold ${
                    pattern.is_active
                      ? "bg-emerald-400/80 text-slate-950"
                      : "bg-slate-600/80 text-white"
                  }`}
                >
                  {pattern.is_active ? "有効" : "無効"}
                </button>
              </form>
            </div>

            <form action={updatePattern} className="space-y-3">
              <input type="hidden" name="patternId" value={pattern.pattern_id} />
              
              <div className="grid grid-cols-3 gap-3">
                <label className="block text-xs">
                  名前
                  <input
                    type="text"
                    name="name"
                    defaultValue={pattern.name}
                    className="mt-1 w-full rounded-lg bg-white/10 px-2 py-1 text-sm"
                  />
                </label>
                <label className="block text-xs">
                  グレード
                  <select
                    name="grade"
                    defaultValue={pattern.grade}
                    className="mt-1 w-full rounded-lg bg-white/10 px-2 py-1 text-sm"
                  >
                    {grades.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {pattern.steps.map((step: any, idx: number) => (
                  <div key={idx} className="space-y-2 rounded-lg border border-white/5 bg-white/5 p-2">
                    <p className="text-xs font-semibold">ステップ{idx + 1}</p>
                    <label className="block text-xs">
                      数字
                      <select
                        name={`step${idx + 1}_number`}
                        defaultValue={step.number}
                        className="mt-1 w-full rounded-lg bg-white/10 px-2 py-1 text-xs"
                      >
                        {numbers.map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-xs">
                      色
                      <select
                        name={`step${idx + 1}_color`}
                        defaultValue={step.color}
                        className="mt-1 w-full rounded-lg bg-white/10 px-2 py-1 text-xs"
                      >
                        {colors.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                ))}
              </div>

              <button className="w-full rounded-xl bg-blue-400/80 px-4 py-2 text-sm font-semibold text-slate-950">
                変更を保存
              </button>
            </form>
          </div>
        ))}
      </section>
    </div>
  );
}
