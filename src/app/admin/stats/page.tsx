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
    <div className="space-y-6 text-primary">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">Statistics</p>
        <h1 className="text-3xl font-bold">統計ダッシュボード</h1>
        <p className="text-sm text-secondary">ガチャ結果の傾向と実績RTPを確認できます。</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-accent/25 bg-card/70 p-5 shadow-library-card">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">総ガチャ数</p>
          <p className="mt-2 text-3xl font-semibold">{totalPlays.toLocaleString()}</p>
          <p className="text-xs text-secondary">最後の記録: {lastPlay}</p>
        </div>
        <div className="rounded-3xl border border-accent/25 bg-card/70 p-5 shadow-library-card">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">隠された章</p>
          <p className="mt-2 text-3xl font-semibold">{summary.reversalCount.toLocaleString()}</p>
          <p className="text-xs text-secondary">発動率 {formatPercent(reversalRate)}</p>
        </div>
        <div className="rounded-3xl border border-accent/25 bg-card/70 p-5 shadow-library-card">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">平均★</p>
          <p className="mt-2 text-3xl font-semibold">{averageStar.toFixed(2)}</p>
          <p className="text-xs text-secondary">理論値と差分 {Math.max(0, averageStar - 6).toFixed(2)}</p>
        </div>
        <div className="rounded-3xl border border-accent/25 bg-card/70 p-5 shadow-library-card">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">設定RTP総量</p>
          <p className="mt-2 text-3xl font-semibold">{formatPercent(expectedRtp)}</p>
          <p className="text-xs text-secondary">gacha_config.rtp_config の合計</p>
        </div>
      </section>

      <section className="rounded-3xl border border-accent/25 bg-card/70 p-6 shadow-library-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">Star Distribution</p>
            <h2 className="text-2xl font-bold">星ごとの分布</h2>
          </div>
          <p className="text-xs text-secondary">実績 vs 設定</p>
        </div>
        <div className="mt-4 space-y-3">
          {distribution.map((slot) => (
            <div key={slot.starLevel} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <p className="font-medium">★{slot.starLevel}</p>
                <div className="text-xs text-secondary">
                  <span className="mr-3">実績 {slot.actualTotal.toLocaleString()} ({formatPercent(slot.actualRatio)})</span>
                  <span>設定 {formatPercent(slot.plan)}</span>
                </div>
              </div>
              <div className="relative h-2 w-full rounded-full bg-[#222222]/40">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-accent/30"
                  style={{ width: `${Math.min(100, slot.plan * 100)}%` }}
                  aria-hidden
                />
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-accent"
                  style={{ width: `${Math.min(100, slot.actualRatio * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-accent/25 bg-card/70 p-6 shadow-library-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">Top Cards</p>
            <h2 className="text-2xl font-bold">人気の書</h2>
          </div>
          <p className="text-xs text-secondary">上位 {leaderboard.length} 枚</p>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          {leaderboard.length === 0 && <p className="text-secondary">まだ統計データがありません。</p>}
          {leaderboard.map((entry, index) => (
            <div key={entry.cardId} className="flex items-center justify-between rounded-2xl border border-accent/20 bg-card/60 px-4 py-3">
              <div>
                <p className="font-medium">#{index + 1} {entry.cardName}</p>
                <p className="text-xs text-secondary">★{entry.starLevel} / {entry.rarity}</p>
              </div>
              <span className="text-lg font-semibold">{entry.total.toLocaleString()} 回</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
