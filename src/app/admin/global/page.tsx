import { revalidatePath } from 'next/cache';

import { AdminCard, AdminPageHero, AdminSectionTitle } from '@/components/admin/admin-ui';
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
      <AdminPageHero
        eyebrow="Global"
        title="共通ハズレ率設定"
        description="全キャラクターに効くLOSS率をひとつのスライダーで調整します。"
      />

      <AdminCard>
        <AdminSectionTitle title="ハズレ率（LOSS率）" description="0% = 全て当たり / 100% = 全てハズレ" />
        <form action={updateGlobalLossRate} className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">現在の値</span>
            <span className="text-3xl font-bold text-yellow-300">{currentLossRate}%</span>
          </div>
          <input
            type="range"
            name="lossRate"
            min={0}
            max={100}
            step={1}
            defaultValue={currentLossRate}
            className="w-full accent-yellow-300"
          />
          <p className="text-xs text-white/60">仕様書の推奨値は 60% 前後です。</p>
          <button
            type="submit"
            className="mt-2 w-full rounded-2xl bg-gradient-to-r from-[#7efde5] to-[#4dd8ff] px-4 py-3 text-sm font-semibold text-[#050505]"
          >
            保存する
          </button>
        </form>
      </AdminCard>
    </div>
  );
}
