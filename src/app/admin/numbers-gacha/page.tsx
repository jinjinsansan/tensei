import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { AdminCard, AdminPageHero, AdminSectionTitle } from '@/components/admin/admin-ui';
import { getServiceSupabase } from '@/lib/supabase/service';
import {
  fetchNumbersGachaSettings,
  fetchNumbersScenarios,
  seedDefaultNumbersScenarios,
  upsertNumbersGachaSettings,
} from '@/lib/data/numbers-gacha';
import type { NumbersScenario } from '@/lib/numbers-gacha/types';

const STAR_LABELS = [
  '★1', '★2', '★3', '★4', '★5', '★6', '★7', '★8', '★9', '★10', '★11', '★12',
];

function parseStarDistribution(formData: FormData) {
  return Array.from({ length: 12 }, (_, i) => {
    const raw = Number(formData.get(`star_${i + 1}`) ?? 0);
    return Number.isFinite(raw) ? Math.max(raw, 0) : 0;
  });
}

async function updateSettings(formData: FormData) {
  'use server';
  const supabase = getServiceSupabase();
  const lossRateRaw = Number(formData.get('lossRate') ?? 60);
  const lossRate = Number.isFinite(lossRateRaw) ? Math.min(Math.max(lossRateRaw, 0), 100) : 60;
  const starDistribution = parseStarDistribution(formData);

  const totalStar = starDistribution.reduce((s, v) => s + v, 0);
  if (Math.abs(totalStar - 100) > 0.1) {
    return redirect(`/admin/numbers-gacha?error=star_total&total=${totalStar.toFixed(1)}`);
  }

  await upsertNumbersGachaSettings(supabase, {
    lossRate,
    starDistribution,
  });

  revalidatePath('/admin/numbers-gacha');
  return redirect('/admin/numbers-gacha?saved=settings');
}

async function updateScenarios(formData: FormData) {
  'use server';
  const supabase = getServiceSupabase();
  const entries: { id: string; is_active: boolean; weight: number }[] = [];
  formData.forEach((value, key) => {
    if (key.startsWith('scenario_weight_')) {
      const id = key.replace('scenario_weight_', '');
      const weight = Number(value ?? 10);
      const isActive = formData.get(`scenario_active_${id}`) === 'on';
      entries.push({ id, is_active: isActive, weight: Number.isFinite(weight) ? weight : 10 });
    }
  });

  if (entries.length) {
    const { error } = await (supabase.from('numbers_gacha_scenarios' as never) as ReturnType<typeof supabase.from>)
      .upsert(entries as never, { onConflict: 'id' } as never);
    if (error) {
      console.error('[update scenarios] error', error);
      return redirect('/admin/numbers-gacha?error=scenario');
    }
  }

  revalidatePath('/admin/numbers-gacha');
  return redirect('/admin/numbers-gacha?saved=scenarios');
}

async function seedPresets() {
  'use server';
  const supabase = getServiceSupabase();
  await seedDefaultNumbersScenarios(supabase, true);
  revalidatePath('/admin/numbers-gacha');
  return redirect('/admin/numbers-gacha?saved=seeded');
}

export default async function NumbersGachaAdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; total?: string; saved?: string }>;
}) {
  const params = await searchParams;
  const supabase = getServiceSupabase();
  const settings = await fetchNumbersGachaSettings(supabase);
  const scenarios = await fetchNumbersScenarios(supabase, { includeInactive: true });

  const totalStar = settings.starDistribution.reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-6">
      <AdminPageHero
        eyebrow="Countdown Challenge"
        title="カウントダウンチャレンジ設定"
        description="カウントダウンチャレンジのハズレ率と★出現率、シナリオ一覧を管理します。"
      />

      {params?.saved && (
        <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-4">
          <p className="text-sm font-semibold text-emerald-300">✅ 保存しました</p>
        </div>
      )}

      {params?.error && (
        <div className="rounded-2xl border border-red-400/40 bg-red-400/10 p-4">
          <p className="text-sm font-semibold text-red-300">❌ エラー</p>
          <p className="mt-1 text-xs text-red-200">
            {params.error === 'star_total' && `★出現率の合計が100%になるように設定してください（現在: ${params.total ?? '?'}%）`}
            {params.error === 'scenario' && 'シナリオ更新に失敗しました。'}
          </p>
        </div>
      )}

      <form action={updateSettings} className="space-y-6">
        <AdminCard>
          <AdminSectionTitle title="ハズレ率" description="0% = 全て当たり / 100% = 全てハズレ" />
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">現在の値</span>
              <span className="text-3xl font-bold text-yellow-300">{settings.lossRate}%</span>
            </div>
            <input type="range" name="lossRate" min={0} max={100} step={1} defaultValue={settings.lossRate} className="w-full accent-yellow-300" />
          </div>
        </AdminCard>

        <AdminCard>
          <AdminSectionTitle title="★別出現率" description={`合計が100%になるように設定してください（現在: ${totalStar.toFixed(1)}%）`} />
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {STAR_LABELS.map((label, i) => (
              <div key={label} className="space-y-1">
                <label className="block text-xs text-white/70">{label}</label>
                <input
                  type="number"
                  name={`star_${i + 1}`}
                  min={0}
                  max={100}
                  step={0.1}
                  defaultValue={settings.starDistribution[i] ?? 0}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-right text-sm font-semibold text-white"
                />
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-white/60">来世ガチャの初期値と同じ配分で初期化されています。</p>
        </AdminCard>

        <button
          type="submit"
          className="w-full rounded-2xl bg-gradient-to-r from-[#7efde5] to-[#4dd8ff] px-4 py-4 text-sm font-bold tracking-[0.1em] text-[#050505]"
        >
          設定を保存する
        </button>
      </form>

      <AdminCard>
        <div className="flex items-center justify-between gap-4">
          <AdminSectionTitle title="プリセットシナリオ" description="50パターンのシナリオを有効化/重み付けできます。" />
          <form action={seedPresets}>
            <button className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15">
              プリセットを再投入
            </button>
          </form>
        </div>

        <form action={updateScenarios} className="mt-4 space-y-3">
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="min-w-full text-sm text-white/80">
              <thead className="bg-white/5 text-xs uppercase tracking-[0.2em] text-white/70">
                <tr>
                  <th className="px-3 py-2 text-left">コード</th>
                  <th className="px-3 py-2 text-left">ラベル</th>
                  <th className="px-3 py-2">結果</th>
                  <th className="px-3 py-2">ステージ</th>
                  <th className="px-3 py-2">重み</th>
                  <th className="px-3 py-2">有効</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((s: NumbersScenario) => (
                  <tr key={s.id ?? s.code} className="border-t border-white/5">
                    <td className="px-3 py-2 font-mono text-xs text-white/80">{s.code}</td>
                    <td className="px-3 py-2 text-white">{s.label}</td>
                    <td className="px-3 py-2 text-center text-white/80">{s.resultType}</td>
                    <td className="px-3 py-2 text-center text-white/70">{s.finalStage}</td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        name={`scenario_weight_${s.id}`}
                        min={1}
                        max={999}
                        defaultValue={s.weight ?? 10}
                        className="w-20 rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-right text-xs text-white"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        name={`scenario_active_${s.id}`}
                        defaultChecked={s.isActive ?? true}
                        className="h-4 w-4 accent-emerald-400"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-right">
            <button
              type="submit"
              className="inline-flex items-center rounded-xl bg-gradient-to-r from-[#ff9ad6] to-[#ff6fb0] px-4 py-2 text-xs font-semibold text-white"
            >
              シナリオ設定を保存
            </button>
          </div>
        </form>
      </AdminCard>
    </div>
  );
}
