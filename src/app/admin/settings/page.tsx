"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Rarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR' | 'LR';

export default function SettingsPage() {
  const router = useRouter();
  const [lossRate, setLossRate] = useState(60);
  const [dondenRate, setDondenRate] = useState(15);
  const [rarityDistribution, setRarityDistribution] = useState({
    N: 35,
    R: 25,
    SR: 20,
    SSR: 12,
    UR: 6,
    LR: 2,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleRarityChange = (rarity: Rarity, value: number) => {
    setRarityDistribution((prev) => ({
      ...prev,
      [rarity]: value,
    }));
  };

  const getTotalRarity = () => {
    return Object.values(rarityDistribution).reduce((sum, val) => sum + val, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // バリデーション
    const total = getTotalRarity();
    if (Math.abs(total - 100) > 0.01) {
      setError(`レア度分布の合計が100%である必要があります（現在: ${total}%）`);
      return;
    }

    if (lossRate < 0 || lossRate > 100) {
      setError("ハズレ率は0〜100%の範囲で指定してください");
      return;
    }

    if (dondenRate < 0 || dondenRate > 100) {
      setError("どんでん返し発動率は0〜100%の範囲で指定してください");
      return;
    }

    setSaving(true);

    try {
      // RTP設定を構築
      const rtpConfig = Object.entries(rarityDistribution).map(([rarity, probability], index) => ({
        star: index + 1,
        probability: probability / 100,
      }));

      // リバーサル率を構築
      const reversalRates = Object.fromEntries(
        Object.keys(rarityDistribution).map((_, index) => [
          String(index + 1),
          dondenRate / 100,
        ])
      );

      // キャラクター比率（健太のみ）
      const characterWeights = [
        {
          characterId: "11111111-1111-4111-8111-111111111111",
          weight: 1,
        },
      ];

      const response = await fetch("/api/admin/gacha-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lossRate: lossRate / 100,
          rtpConfig,
          reversalRates,
          characterWeights,
        }),
      });

      if (!response.ok) {
        throw new Error("設定の保存に失敗しました");
      }

      router.refresh();
      alert("設定を保存しました");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  const totalRarity = getTotalRarity();
  const isValidTotal = Math.abs(totalRarity - 100) < 0.01;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">RTP設定</h1>
        <p className="text-sm text-slate-300">ハズレ率、レア度分布、どんでん返し発動率を調整します。</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ハズレ率 */}
        <section className="space-y-4 rounded-3xl border border-white/15 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">ハズレ率</h2>
            <span className="text-2xl font-bold text-yellow-400">{lossRate}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={lossRate}
            onChange={(e) => setLossRate(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-slate-400">
            0% = 全て当たり / 100% = 全てハズレ（推奨: 50〜70%）
          </p>
        </section>

        {/* レア度分布（当たり時） */}
        <section className="space-y-4 rounded-3xl border border-white/15 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">レア度分布（当たり時）</h2>
            <span
              className={`text-lg font-bold ${
                isValidTotal ? "text-emerald-400" : "text-red-400"
              }`}
            >
              合計: {totalRarity.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-slate-400">当たりを引いた時の各レア度の出現確率（合計100%）</p>

          <div className="space-y-3">
            {(Object.entries(rarityDistribution) as [Rarity, number][]).map(([rarity, value]) => (
              <div key={rarity} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold">{rarity}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={value}
                    onChange={(e) => handleRarityChange(rarity, Number(e.target.value))}
                    className="w-20 rounded-xl bg-white/10 px-3 py-1 text-right"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={value}
                  onChange={(e) => handleRarityChange(rarity, Number(e.target.value))}
                  className="w-full"
                />
              </div>
            ))}
          </div>

          {!isValidTotal && (
            <p className="text-sm text-red-400">
              ⚠️ 合計が100%になるように調整してください
            </p>
          )}
        </section>

        {/* どんでん返し発動率 */}
        <section className="space-y-4 rounded-3xl border border-white/15 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">どんでん返し発動率</h2>
            <span className="text-2xl font-bold text-yellow-400">{dondenRate}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={dondenRate}
            onChange={(e) => setDondenRate(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-slate-400">
            当たり時に低レアから高レアへ昇格する確率（推奨: 10〜20%）
          </p>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !isValidTotal}
          className="w-full rounded-2xl bg-emerald-400/80 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50"
        >
          {saving ? "保存中..." : "設定を保存"}
        </button>
      </form>
    </div>
  );
}
