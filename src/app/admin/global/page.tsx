import { revalidatePath } from 'next/cache';

import { getServiceSupabase } from '@/lib/supabase/service';

async function updateGlobalLossRate(formData: FormData) {
  'use server';
  const supabase = getServiceSupabase();
  const raw = Number(formData.get('lossRate') ?? 60);
  const clamped = Number.isFinite(raw) ? Math.min(Math.max(raw, 0), 100) : 60;

  await supabase
    .from('gacha_global_config')
    .upsert(
      {
        id: '00000000-0000-0000-0000-000000000001',
        loss_rate: clamped,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );

  revalidatePath('/admin/global');
}

export default async function GlobalConfigPage() {
  const supabase = getServiceSupabase();
  const { data } = await supabase
    .from('gacha_global_config')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .maybeSingle();

  const currentLossRate = typeof data?.loss_rate === 'number' ? data.loss_rate : 60;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">共通ハズレ率設定</h1>
        <p className="text-sm text-slate-300">全キャラクター共通のLOSS率を設定します（0〜100%）。</p>
      </header>

      <form action={updateGlobalLossRate} className="space-y-4 rounded-3xl border border-white/15 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">ハズレ率（LOSS率）</h2>
          <span className="text-2xl font-bold text-yellow-400">{currentLossRate}%</span>
        </div>
        <input
          type="range"
          name="lossRate"
          min={0}
          max={100}
          step={1}
          defaultValue={currentLossRate}
          className="w-full"
        />
        <p className="text-xs text-slate-400">
          0% = 全て当たり / 100% = 全てハズレ（仕様書推奨値: 60% 前後）
        </p>
        <button
          type="submit"
          className="mt-4 w-full rounded-2xl bg-emerald-400/80 px-4 py-3 text-sm font-semibold text-slate-950"
        >
          保存する
        </button>
      </form>
    </div>
  );
}
