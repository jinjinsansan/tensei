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

async function updateLineRewardPoints(formData: FormData) {
  'use server';
  const supabase = getServiceSupabase();
  const raw = Number(formData.get('linePoints') ?? 50);
  const clamped = Number.isFinite(raw) ? Math.min(Math.max(raw, 0), 9999) : 50;

  await supabase
    .from('gacha_global_config')
    .upsert(
      {
        id: '00000000-0000-0000-0000-000000000001',
        line_reward_points: clamped,
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
  const currentLineReward = typeof data?.line_reward_points === 'number' ? data.line_reward_points : 50;

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

      <AdminCard>
        <AdminSectionTitle
          title="LINE特典 Nポイント"
          description="公式LINE追加時に自動/手動で付与するNポイントの基準値。ユーザー向けページに反映されます。"
        />
        <form action={updateLineRewardPoints} className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">現在の設定</span>
            <span className="text-3xl font-bold text-emerald-300">{currentLineReward} pt</span>
          </div>
          <input
            type="number"
            name="linePoints"
            min={0}
            max={9999}
            defaultValue={currentLineReward}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-right text-2xl font-semibold text-white"
          />
          <p className="text-xs text-white/60">0〜9999ポイントの範囲で指定できます。登録ページではこの値がリアルタイムに表示されます。</p>
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
