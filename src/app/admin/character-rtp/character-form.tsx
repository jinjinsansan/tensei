'use client';

import { useState } from 'react';
import { SubmitButton } from './submit-button';

type Props = {
  characterId: string;
  characterName: string;
  isActive: boolean;
  weight: number;
  rtpN: number;
  rtpR: number;
  rtpSR: number;
  rtpSSR: number;
  rtpUR: number;
  rtpLR: number;
  dondenRate: number;
  action: (formData: FormData) => void;
};

export function CharacterForm({
  characterId,
  characterName,
  isActive,
  weight,
  rtpN,
  rtpR,
  rtpSR,
  rtpSSR,
  rtpUR,
  rtpLR,
  dondenRate,
  action,
}: Props) {
  const [rarityValues, setRarityValues] = useState({
    N: rtpN,
    R: rtpR,
    SR: rtpSR,
    SSR: rtpSSR,
    UR: rtpUR,
    LR: rtpLR,
  });

  const totalRtp = Object.values(rarityValues).reduce((sum, val) => sum + val, 0);
  const isValidTotal = Math.abs(totalRtp - 100) < 0.1;

  const handleRarityChange = (rarity: keyof typeof rarityValues, value: string) => {
    const numValue = Number(value) || 0;
    setRarityValues((prev) => ({ ...prev, [rarity]: numValue }));
  };

  return (
    <form action={action} className="space-y-4 rounded-3xl border border-accent/25 bg-card/70 p-6 shadow-library-card">
      <input type="hidden" name="characterId" value={characterId} />
      <input type="hidden" name="characterName" value={characterName} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">Character</p>
          <h2 className="text-xl font-bold">{characterName}</h2>
          <p className="text-xs text-secondary">ID: {characterId}</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={isActive}
              className="h-4 w-4 rounded border-accent/40 bg-transparent"
            />
            <span>ガチャ対象に含める</span>
          </label>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-secondary">出現比率</span>
            <input
              type="number"
              name="weight"
              min={0}
              step={1}
              defaultValue={weight}
              className="w-20 rounded-xl border border-accent/30 bg-black/30 px-2 py-1 text-right text-sm"
            />
            <span className="text-secondary">pt</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">Rarity Distribution</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {(['N', 'R', 'SR', 'SSR', 'UR', 'LR'] as const).map((label) => (
              <label key={label} className="flex items-center justify-between gap-2 rounded-xl bg-black/20 px-3 py-2">
                <span className="font-medium">{label}</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    name={`rarity_${label}`}
                    min={0}
                    max={100}
                    step={1}
                    value={rarityValues[label]}
                    onChange={(e) => handleRarityChange(label, e.target.value)}
                    className="w-20 rounded-lg border border-accent/30 bg-black/40 px-2 py-1 text-right text-xs"
                  />
                  <span className="text-[11px] text-secondary">%</span>
                </div>
              </label>
            ))}
          </div>
          <p className={`text-xs ${isValidTotal ? 'text-secondary' : 'text-red-400 font-semibold'}`}>
            合計: {totalRtp.toFixed(1)}% {!isValidTotal && '⚠️ 100%にしてください'}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">Donden</p>
          <div className="space-y-2 rounded-xl bg-black/20 p-4 text-sm">
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
                  className="w-20 rounded-lg border border-accent/30 bg-black/40 px-2 py-1 text-right text-xs"
                />
                <span className="text-[11px] text-secondary">%</span>
              </div>
            </label>
            <p className="text-xs text-secondary">
              reversal video &amp; dondenRoutes を持つカードのみが対象になります。
            </p>
          </div>
        </div>
      </div>

      {!isValidTotal && (
        <div className="rounded-2xl border border-yellow-400/40 bg-yellow-950/40 p-3">
          <p className="text-xs font-semibold text-yellow-300">
            ⚠️ レアリティ分布の合計を100%にしてください（現在: {totalRtp.toFixed(1)}%）
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <SubmitButton characterName={characterName} />
      </div>
    </form>
  );
}
