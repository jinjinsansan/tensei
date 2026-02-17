import { AdminCard, AdminPageHero, AdminSectionTitle, AdminSubCard } from '@/components/admin/admin-ui';
import { fetchGachaCardLeaderboard, fetchGachaConfig, fetchGachaStarCounts, fetchGachaSummaryStats } from '@/lib/data/gacha';
import { getServiceSupabase } from '@/lib/supabase/service';

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return '0%';
  return `${(value * 100).toFixed(1)}%`;
}

export default async function AdminStatsPage() {
  const supabase = getServiceSupabase();
  const [summary, starCounts, leaderboard, config] = await Promise.all([
    fetchGachaSummaryStats(supabase),
    fetchGachaStarCounts(supabase),
    fetchGachaCardLeaderboard(supabase, 8),
    fetchGachaConfig(supabase),
  ]);

  const totalPlays = summary.totalPlays || 0;
  const expectedRtp = config.rtp.reduce((acc, slot) => acc + slot.probability, 0);
  const distribution = Array.from({ length: 12 }, (_, index) => {
    const starLevel = index + 1;
    const actualTotal = starCounts.find((entry) => entry.starLevel === starLevel)?.total ?? 0;
    const plan = config.rtp.find((slot) => slot.star === starLevel)?.probability ?? 0;
    const actualRatio = totalPlays > 0 ? actualTotal / totalPlays : 0;
    return { starLevel, actualTotal, actualRatio, plan };
  });

  const reversalRate = totalPlays > 0 ? summary.reversalCount / totalPlays : 0;
  const averageStar = summary.averageStar || 0;
  const lastPlay = summary.lastPlay ? new Date(summary.lastPlay).toLocaleString('ja-JP') : '---';

  return (
    <div className="space-y-6 text-white">
      <AdminPageHero
        eyebrow="Statistics"
        title="統計ダッシュボード"
        description="ガチャ結果の傾向と実績RTPを俯瞰します。"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[{
          label: '総ガチャ数',
          value: totalPlays.toLocaleString(),
          extra: `最後の記録: ${lastPlay}`,
        }, {
          label: '隠された章',
          value: summary.reversalCount.toLocaleString(),
          extra: `発動率 ${formatPercent(reversalRate)}`,
        }, {
          label: '平均★',
          value: averageStar.toFixed(2),
          extra: `理論値との差 ${Math.max(0, averageStar - 6).toFixed(2)}`,
        }, {
          label: '設定RTP総量',
          value: formatPercent(expectedRtp),
          extra: 'gacha_config.rtp_config の合計',
        }].map((item) => (
          <AdminSubCard key={item.label}>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{item.value}</p>
            <p className="text-xs text-white/60">{item.extra}</p>
          </AdminSubCard>
        ))}
      </section>

      <AdminCard>
        <div className="flex items-center justify-between">
          <AdminSectionTitle title="星ごとの分布" description="実績 vs 設定" />
        </div>
        <div className="mt-6 space-y-3">
          {distribution.map((slot) => (
            <div key={slot.starLevel} className="space-y-1">
              <div className="flex items-center justify-between text-sm text-white/80">
                <p className="font-medium text-white">★{slot.starLevel}</p>
                <div className="text-xs text-white/60">
                  <span className="mr-3">実績 {slot.actualTotal.toLocaleString()} ({formatPercent(slot.actualRatio)})</span>
                  <span>設定 {formatPercent(slot.plan)}</span>
                </div>
              </div>
              <div className="relative h-2 w-full rounded-full bg-white/10">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-white/20"
                  style={{ width: `${Math.min(100, slot.plan * 100)}%` }}
                  aria-hidden
                />
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#74f3ff] to-[#fbb1ff]"
                  style={{ width: `${Math.min(100, slot.actualRatio * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard>
        <div className="flex items-center justify-between">
          <AdminSectionTitle title="人気カード" description={`上位 ${leaderboard.length} 枚`} />
        </div>
        <div className="mt-6 space-y-2 text-sm">
          {leaderboard.length === 0 && <p className="text-white/60">まだ統計データがありません。</p>}
          {leaderboard.map((entry, index) => (
            <div key={entry.cardId} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <div>
                <p className="font-medium text-white">#{index + 1} {entry.cardName}</p>
                <p className="text-xs text-white/60">★{entry.starLevel} / {entry.rarity}</p>
              </div>
              <span className="text-lg font-semibold text-white">{entry.total.toLocaleString()} 回</span>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
