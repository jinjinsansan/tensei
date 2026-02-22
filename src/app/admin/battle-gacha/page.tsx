import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { AdminCard, AdminPageHero, AdminSectionTitle } from '@/components/admin/admin-ui';
import { getServiceSupabase } from '@/lib/supabase/service';
import { fetchBattleGachaSettings, DEFAULT_BATTLE_STAR_DISTRIBUTION } from '@/lib/data/battle-gacha';

const STAR_LABELS = [
  '★1 (N)', '★2 (N)', '★3 (R)', '★4 (R)',
  '★5 (SR)', '★6 (SR)', '★7 (SSR)', '★8 (SSR)',
  '★9 (UR)', '★10 (UR)', '★11 (LR)', '★12 (LR)',
];

async function updateBattleSettings(formData: FormData) {
  'use server';
  const supabase = getServiceSupabase();

  const isEnabled = formData.get('isEnabled') === 'on';
  const lossRateRaw = Number(formData.get('lossRate') ?? 60);
  const lossRate = Number.isFinite(lossRateRaw) ? Math.min(Math.max(lossRateRaw, 0), 100) : 60;
  const reversalRateRaw = Number(formData.get('reversalRate') ?? 15);
  const reversalRate = Number.isFinite(reversalRateRaw) ? Math.min(Math.max(reversalRateRaw, 0), 100) : 15;
  const dondenRateRaw = Number(formData.get('dondenRate') ?? 15);
  const dondenRate = Number.isFinite(dondenRateRaw) ? Math.min(Math.max(dondenRateRaw, 0), 100) : 15;

  const starValues = Array.from({ length: 12 }, (_, i) => {
    const raw = Number(formData.get(`star_${i + 1}`) ?? 0);
    return Number.isFinite(raw) ? Math.max(raw, 0) : 0;
  });

  const totalStar = starValues.reduce((s, v) => s + v, 0);
  if (Math.abs(totalStar - 100) > 0.1) {
    return redirect(`/admin/battle-gacha?error=star_total&total=${totalStar.toFixed(1)}`);
  }

  const patch: Record<string, unknown> = {
    is_enabled: isEnabled,
    loss_rate: lossRate,
    reversal_rate: reversalRate,
    donden_rate: dondenRate,
    star_distribution: starValues,
    updated_at: new Date().toISOString(),
  };

  const { error } = await (supabase.from('battle_gacha_settings' as never) as ReturnType<typeof supabase.from>)
    .update(patch as never)
    .eq('id', '00000000-0000-0000-0000-000000000002');

  if (error) {
    console.error('[updateBattleSettings] error:', error);
    return redirect(`/admin/battle-gacha?error=db&msg=${encodeURIComponent((error as { message?: string }).message ?? 'DB error')}`);
  }

  revalidatePath('/admin/battle-gacha');
  return redirect('/admin/battle-gacha?success=true');
}

export default async function BattleGachaAdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; success?: string; total?: string; msg?: string }>;
}) {
  const params = await searchParams;
  const supabase = getServiceSupabase();
  const settings = await fetchBattleGachaSettings(supabase);
  const starDist = settings.starDistribution.length === 12
    ? settings.starDistribution
    : [...DEFAULT_BATTLE_STAR_DISTRIBUTION];

  const totalStar = starDist.reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-6">
      <AdminPageHero
        eyebrow="Battle Gacha"
        title="バトルガチャ設定"
        description="バトルガチャのON/OFF、RTP、ハズレ率、どんでん返し率を設定します。"
      />

      {params?.success === 'true' && (
        <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-4">
          <p className="text-sm font-semibold text-emerald-300">✅ 保存しました</p>
        </div>
      )}

      {params?.error && (
        <div className="rounded-2xl border border-red-400/40 bg-red-400/10 p-4">
          <p className="text-sm font-semibold text-red-300">❌ エラー</p>
          <p className="mt-1 text-xs text-red-200">
            {params.error === 'star_total' && `★分布の合計が100%になるように設定してください。（現在: ${params.total}%）`}
            {params.error === 'db' && `データベースエラー: ${params.msg}`}
          </p>
        </div>
      )}

      <form action={updateBattleSettings} className="space-y-6">
        {/* ON/OFF */}
        <AdminCard>
          <AdminSectionTitle title="バトルガチャ ON/OFF" description="OFFの場合、ガチャページのボタンは「準備中」に戻ります。" />
          <div className="mt-6 flex items-center gap-4">
            <label className="relative inline-flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                name="isEnabled"
                defaultChecked={settings.isEnabled}
                className="peer sr-only"
              />
              <div className="peer h-7 w-14 rounded-full bg-white/10 after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-500 peer-checked:after:translate-x-7" />
              <span className="text-sm font-semibold text-white">
                現在: {settings.isEnabled ? <span className="text-emerald-400">有効</span> : <span className="text-red-400">無効（準備中）</span>}
              </span>
            </label>
          </div>
        </AdminCard>

        {/* ハズレ率 */}
        <AdminCard>
          <AdminSectionTitle title="ハズレ率（LOSS率）" description="0% = 全て当たり / 100% = 全てハズレ" />
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">現在の値</span>
              <span className="text-3xl font-bold text-yellow-300">{settings.lossRate}%</span>
            </div>
            <input type="range" name="lossRate" min={0} max={100} step={1} defaultValue={settings.lossRate} className="w-full accent-yellow-300" />
          </div>
        </AdminCard>

        {/* どんでん返し率 */}
        <AdminCard>
          <AdminSectionTitle title="どんでん返し率" description="低★lose → 高★win の逆転演出が発生する確率です。" />
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">現在の値</span>
              <span className="text-3xl font-bold text-purple-300">{settings.dondenRate}%</span>
            </div>
            <input type="range" name="dondenRate" min={0} max={100} step={1} defaultValue={settings.dondenRate} className="w-full accent-purple-400" />
          </div>
        </AdminCard>

        {/* 逆転演出率 */}
        <AdminCard>
          <AdminSectionTitle title="バトル逆転率（reversal_rate）" description="バトルでどんでん返しが発動した際の補助設定（現バージョンは dondenRate と同値を推奨）" />
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">現在の値</span>
              <span className="text-3xl font-bold text-pink-300">{settings.reversalRate}%</span>
            </div>
            <input type="range" name="reversalRate" min={0} max={100} step={1} defaultValue={settings.reversalRate} className="w-full accent-pink-400" />
          </div>
        </AdminCard>

        {/* ★別排出率 */}
        <AdminCard>
          <AdminSectionTitle
            title="★別排出率"
            description={`合計が100%になるように設定してください。現在: ${totalStar.toFixed(1)}%`}
          />
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
                  defaultValue={starDist[i]}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-right text-sm font-semibold text-white"
                />
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-white/50">N:40% / R:30% / SR:15% / SSR:9% / UR:4% / LR:2% が推奨初期値です。</p>
        </AdminCard>

        <button
          type="submit"
          className="w-full rounded-2xl bg-gradient-to-r from-[#ff6fb0] to-[#ff4378] px-4 py-4 text-sm font-bold tracking-[0.1em] text-white shadow-[0_10px_30px_rgba(255,67,120,0.3)]"
        >
          保存する
        </button>
      </form>
    </div>
  );
}
