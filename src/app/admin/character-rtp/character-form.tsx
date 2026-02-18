'use client';

import { useState } from 'react';
import { SubmitButton } from './submit-button';

type Props = {
  characterId: string;
  characterName: string;
  isActive: boolean;
  weight: number;
  starDistribution: number[];
  dondenRate: number;
  action: (formData: FormData) => void;
};

const STAR_LEVELS = Array.from({ length: 12 }, (_, index) => index + 1);

export function CharacterForm({
  characterId,
  characterName,
  isActive,
  weight,
  starDistribution,
  dondenRate,
  action,
}: Props) {
  const [starValues, setStarValues] = useState(() => {
    if (starDistribution.length === 12) {
      return [...starDistribution];
    }
    return STAR_LEVELS.map(() => 0);
  });

  const totalStar = starValues.reduce((sum, val) => sum + (Number.isFinite(val) ? val : 0), 0);
  const isValidTotal = Math.abs(totalStar - 100) < 0.1;

  const handleStarChange = (index: number, value: string) => {
    const parsed = Number(value);
    setStarValues((prev) => {
      const next = [...prev];
      next[index] = Number.isFinite(parsed) ? parsed : 0;
      return next;
    });
  };

  return (
    <form
      action={action}
      className="space-y-5 rounded-3xl border border-white/12 bg-white/[0.04] p-6 shadow-[0_25px_90px_rgba(0,0,0,0.55)] backdrop-blur"
    >
      <input type="hidden" name="characterId" value={characterId} />
      <input type="hidden" name="characterName" value={characterName} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Character</p>
          <h2 className="text-xl font-bold text-white">{characterName}</h2>
          <p className="text-xs text-white/60">ID: {characterId}</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={isActive}
              className="h-4 w-4 rounded border-white/40 bg-transparent"
            />
            <span>ガチャ対象に含める</span>
          </label>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white/60">出現比率</span>
            <input
              type="number"
              name="weight"
              min={0}
              step={1}
              defaultValue={weight}
              className="w-20 rounded-xl border border-white/20 bg-white/[0.02] px-2 py-1 text-right text-sm text-white"
            />
            <span className="text-white/60">pt</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">STAR DISTRIBUTION</p>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            {STAR_LEVELS.map((star, index) => (
              <label
                key={star}
                className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2"
              >
                <span className="font-medium text-white">★{star}</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    name={`star_${star}`}
                    min={0}
                    max={100}
                    step={0.1}
                    value={Number.isFinite(starValues[index]) ? starValues[index] : 0}
                    onChange={(e) => handleStarChange(index, e.target.value)}
                    className="w-20 rounded-lg border border-white/20 bg-transparent px-2 py-1 text-right text-xs text-white"
                  />
                  <span className="text-[11px] text-white/60">%</span>
                </div>
              </label>
            ))}
          </div>
          <p className={`text-xs ${isValidTotal ? 'text-white/60' : 'text-red-400 font-semibold'}`}>
            合計: {totalStar.toFixed(1)}% {!isValidTotal && '⚠️ 100%にしてください'}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Donden</p>
          <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm">
            <label className="flex items-center justify-between gap-2">
              <span>どんでん返し発生率</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="dondenRate"
                  min={0}
                  max={100}
                  step={1}
                  defaultValue={dondenRate}
                  className="w-20 rounded-lg border border-white/20 bg-transparent px-2 py-1 text-right text-xs text-white"
                />
                <span className="text-[11px] text-white/60">%</span>
              </div>
            </label>
            <p className="text-xs text-white/60">
              reversal video &amp; dondenRoutes を持つカードのみが対象になります。
            </p>
          </div>
        </div>
      </div>

      {!isValidTotal && (
        <div className="rounded-2xl border border-yellow-400/40 bg-yellow-400/10 p-3">
          <p className="text-xs font-semibold text-yellow-300">
            ⚠️ ★分布の合計を100%にしてください（現在: {totalStar.toFixed(1)}%）
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <SubmitButton characterName={characterName} />
      </div>
    </form>
  );
}
