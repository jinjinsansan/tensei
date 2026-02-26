import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { AdminCard, AdminPageHero, AdminSectionTitle } from '@/components/admin/admin-ui';
import { getServiceSupabase } from '@/lib/supabase/service';
import { fetchCd2Settings, upsertCd2Settings } from '@/lib/data/cd2-gacha';

async function updateCd2Settings(formData: FormData) {
  'use server';
  const supabase = getServiceSupabase();

  const isEnabled = formData.get('isEnabled') === 'on';

  const clamp = (raw: number, min: number, max: number, fallback: number) =>
    Number.isFinite(raw) ? Math.min(Math.max(raw, min), max) : fallback;

  const lossRate    = clamp(Number(formData.get('lossRate')    ?? 60),  0, 100, 60);
  const dondenRate  = clamp(Number(formData.get('dondenRate')  ?? 10),  0, 100, 10);
  const patliteRate = clamp(Number(formData.get('patliteRate') ?? 5),   0, 100, 5);
  const freezeRate  = clamp(Number(formData.get('freezeRate')  ?? 2),   0, 100, 2);

  await upsertCd2Settings(supabase, {
    isEnabled,
    lossRate,
    dondenRate,
    patliteRate,
    freezeRate,
  });

  revalidatePath('/admin/cd2-gacha');
  return redirect('/admin/cd2-gacha?saved=true');
}

export default async function Cd2GachaAdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = getServiceSupabase();
  const settings = await fetchCd2Settings(supabase);

  // 実効当たり率の計算表示
  const effectiveLossRate = settings.lossRate * (1 - settings.dondenRate / 100);
  const effectiveWinRate  = 100 - effectiveLossRate;

  return (
    <div className="space-y-6">
      <AdminPageHero
        eyebrow="Countdown Challenge 2"
        title="カウントダウンチャレンジ２設定"
        description="RTP（当たり率）・どんでん返し率・パトライト差し込み率・フリーズ当たり率を設定します。"
      />

      {params?.saved && (
        <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-4">
          <p className="text-sm font-semibold text-emerald-300">✅ 保存しました</p>
        </div>
      )}

      {params?.error && (
        <div className="rounded-2xl border border-red-400/40 bg-red-400/10 p-4">
          <p className="text-sm font-semibold text-red-300">❌ エラーが発生しました</p>
        </div>
      )}

      {/* 実効当たり率サマリー */}
      <AdminCard>
        <AdminSectionTitle title="実効当たり率サマリー" description="現在の設定での最終的な当たり/ハズレ確率です。" />
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-center">
            <p className="text-xs text-yellow-300/70">実効当たり率</p>
            <p className="mt-1 text-3xl font-bold text-yellow-300">{effectiveWinRate.toFixed(1)}%</p>
            <p className="mt-1 text-[10px] text-yellow-300/50">（どんでん返し込み）</p>
          </div>
          <div className="rounded-xl border border-zinc-400/30 bg-zinc-400/10 p-4 text-center">
            <p className="text-xs text-zinc-300/70">実効ハズレ率</p>
            <p className="mt-1 text-3xl font-bold text-zinc-300">{effectiveLossRate.toFixed(1)}%</p>
            <p className="mt-1 text-[10px] text-zinc-300/50">（どんでん後の最終ハズレ）</p>
          </div>
        </div>
      </AdminCard>

      <form action={updateCd2Settings} className="space-y-6">

        {/* ON/OFF */}
        <AdminCard>
          <AdminSectionTitle
            title="カウントダウンチャレンジ２ ON/OFF"
            description="OFFの場合、ガチャページのボタンは「準備中」に戻ります。"
          />
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
                現在:{' '}
                {settings.isEnabled
                  ? <span className="text-emerald-400">有効</span>
                  : <span className="text-red-400">無効（準備中）</span>}
              </span>
            </label>
          </div>
        </AdminCard>

        {/* ハズレ率 (RTP) */}
        <AdminCard>
          <AdminSectionTitle
            title="ハズレ率 (RTP設定)"
            description="0% = 全て当たり / 100% = 全てハズレ。どんでん返しが発動するとハズレが当たりに変わります。"
          />
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">現在の値</span>
              <span className="text-3xl font-bold text-yellow-300">{settings.lossRate}%</span>
            </div>
            <input
              type="range"
              name="lossRate"
              min={0}
              max={100}
              step={1}
              defaultValue={settings.lossRate}
              className="w-full accent-yellow-300"
            />
            <p className="text-xs text-white/50">
              推奨値: 60%（デフォルト）
            </p>
          </div>
        </AdminCard>

        {/* どんでん返し率 */}
        <AdminCard>
          <AdminSectionTitle
            title="どんでん返し率"
            description="ハズレと判定されたうちの何%がどんでん返しで当たりになるか。ハズレ演出の後にパトライト・どんでん返し映像が流れ、10からカウントダウンが再スタートします。"
          />
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">現在の値</span>
              <span className="text-3xl font-bold text-purple-300">{settings.dondenRate}%</span>
            </div>
            <input
              type="range"
              name="dondenRate"
              min={0}
              max={100}
              step={1}
              defaultValue={settings.dondenRate}
              className="w-full accent-purple-400"
            />
            <div className="rounded-xl border border-purple-400/20 bg-purple-400/5 p-3 text-xs text-purple-200/80">
              例) ハズレ率60% × どんでん返し率10% → ハズレの6%がどんでん返し当たりに変換
            </div>
          </div>
        </AdminCard>

        {/* パトライト差し込み率 */}
        <AdminCard>
          <AdminSectionTitle
            title="パトライト差し込み率（プレミア）"
            description="当たりのうち何%でパトライト映像が5→4の間に差し込まれるか。出現時は確実に当たり。当たりの約20回に1回が目安（5%）。"
          />
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">現在の値</span>
              <span className="text-3xl font-bold text-amber-300">{settings.patliteRate}%</span>
            </div>
            <input
              type="range"
              name="patliteRate"
              min={0}
              max={50}
              step={0.5}
              defaultValue={settings.patliteRate}
              className="w-full accent-amber-400"
            />
            <p className="text-xs text-white/50">
              推奨値: 5%（当たりの約1/20）
            </p>
          </div>
        </AdminCard>

        {/* フリーズ率 */}
        <AdminCard>
          <AdminSectionTitle
            title="フリーズ当たり率（超プレミア）"
            description="当たりのうち何%がフリーズ当たりになるか。カウントダウン途中に突然10秒間ボタン操作不能になり、強制的に演出を見せる超プレミア演出。当たりの約50回に1回が目安（2%）。"
          />
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">現在の値</span>
              <span className="text-3xl font-bold text-cyan-300">{settings.freezeRate}%</span>
            </div>
            <input
              type="range"
              name="freezeRate"
              min={0}
              max={20}
              step={0.5}
              defaultValue={settings.freezeRate}
              className="w-full accent-cyan-400"
            />
            <p className="text-xs text-white/50">
              推奨値: 2%（当たりの約1/50）
            </p>
          </div>
        </AdminCard>

        <button
          type="submit"
          className="w-full rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 px-4 py-4 text-sm font-bold tracking-[0.1em] text-white shadow-[0_10px_30px_rgba(239,68,68,0.3)]"
        >
          設定を保存する
        </button>
      </form>
    </div>
  );
}
