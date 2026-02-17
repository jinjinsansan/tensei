import { revalidatePath } from "next/cache";

import { AdminCard, AdminPageHero, AdminSectionTitle, AdminSubCard } from "@/components/admin/admin-ui";
import { getServiceSupabase } from "@/lib/supabase/service";

type CdColor = 'green' | 'blue' | 'red' | 'gold' | 'rainbow' | 'white';
type Grade = 'E1' | 'E2' | 'E3' | 'E4' | 'E5';

type CountdownStep = {
  number: number;
  color: CdColor;
};

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

  const colors: CdColor[] = ['green', 'blue', 'red', 'gold', 'rainbow', 'white'];
  const grades: Grade[] = ['E1', 'E2', 'E3', 'E4', 'E5'];
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="space-y-6">
      <AdminPageHero
        eyebrow="Countdown"
        title="カウントダウンパターン管理"
        description="パターンの有効化、新規作成、並びの調整をまとめて行えます。"
      />

      <AdminCard>
        <AdminSectionTitle title="新規パターン追加" description="4ステップの数字と色を組み合わせます" />
        <form action={createPattern} className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block text-sm">
              パターンID
              <input
                type="text"
                name="patternId"
                required
                placeholder="E1_01"
                className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2 text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none"
              />
            </label>
            <label className="block text-sm">
              名前
              <input
                type="text"
                name="name"
                required
                placeholder="最高数字緑"
                className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2 text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none"
              />
            </label>
            <label className="block text-sm">
              グレード
              <select
                name="grade"
                required
                className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2 text-sm text-white focus:border-white/60"
              >
                {grades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((step) => (
              <AdminSubCard key={step}>
                <p className="text-xs font-semibold text-white/80">ステップ{step}</p>
                <label className="block text-xs">
                  数字
                  <select
                    name={`step${step}_number`}
                    required
                    className="mt-1 w-full rounded-lg border border-white/15 bg-white/[0.04] px-2 py-1 text-sm text-white focus:border-white/60"
                  >
                    {numbers.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs">
                  色
                  <select
                    name={`step${step}_color`}
                    required
                    className="mt-1 w-full rounded-lg border border-white/15 bg-white/[0.04] px-2 py-1 text-sm text-white focus:border-white/60"
                  >
                    {colors.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              </AdminSubCard>
            ))}
          </div>

          <button className="w-full rounded-2xl bg-gradient-to-r from-[#7efde5] to-[#53c9ff] px-6 py-3 font-semibold text-[#050505]">
            新規パターンを追加
          </button>
        </form>
      </AdminCard>

      <AdminCard>
        <AdminSectionTitle title={`既存パターン（${patterns?.length ?? 0}件）`} description="必要に応じて編集・無効化できます" />
        <div className="mt-6 space-y-4">
          {patterns?.map((pattern) => (
            <AdminSubCard key={pattern.pattern_id} className="space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {pattern.pattern_id} - {pattern.name}
                  </h3>
                  <p className="text-xs text-white/60">グレード: {pattern.grade}</p>
                </div>
                <form action={togglePattern} className="md:w-auto">
                  <input type="hidden" name="patternId" value={pattern.pattern_id} />
                  <input type="hidden" name="isActive" value={String(pattern.is_active)} />
                  <button
                    className={`rounded-full px-4 py-1 text-xs font-semibold transition ${
                      pattern.is_active
                        ? 'border border-emerald-300/50 bg-emerald-400/20 text-emerald-100'
                        : 'border border-white/15 bg-white/[0.02] text-white/70'
                    }`}
                  >
                    {pattern.is_active ? '有効' : '無効'}
                  </button>
                </form>
              </div>

              <form action={updatePattern} className="space-y-3">
                <input type="hidden" name="patternId" value={pattern.pattern_id} />

                <div className="grid gap-3 md:grid-cols-3">
                  <label className="block text-xs">
                    名前
                    <input
                      type="text"
                      name="name"
                      defaultValue={pattern.name}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-white/[0.03] px-2 py-1 text-sm text-white focus:border-white/60"
                    />
                  </label>
                  <label className="block text-xs">
                    グレード
                    <select
                      name="grade"
                      defaultValue={pattern.grade}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-white/[0.03] px-2 py-1 text-sm text-white focus:border-white/60"
                    >
                      {grades.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  {Array.isArray(pattern.steps) && (pattern.steps as CountdownStep[]).map((step, idx) => (
                    <div key={idx} className="space-y-2 rounded-lg border border-white/10 bg-white/[0.02] p-3">
                      <p className="text-xs font-semibold text-white/80">ステップ{idx + 1}</p>
                      <label className="block text-xs">
                        数字
                        <select
                          name={`step${idx + 1}_number`}
                          defaultValue={step.number}
                          className="mt-1 w-full rounded-lg border border-white/15 bg-white/[0.04] px-2 py-1 text-xs text-white focus:border-white/60"
                        >
                          {numbers.map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-xs">
                        色
                        <select
                          name={`step${idx + 1}_color`}
                          defaultValue={step.color}
                          className="mt-1 w-full rounded-lg border border-white/15 bg-white/[0.04] px-2 py-1 text-xs text-white focus:border-white/60"
                        >
                          {colors.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ))}
                </div>

                <button className="w-full rounded-xl bg-gradient-to-r from-[#6dd5ff] to-[#5efce8] px-4 py-2 text-sm font-semibold text-[#04161c]">
                  変更を保存
                </button>
              </form>
            </AdminSubCard>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
