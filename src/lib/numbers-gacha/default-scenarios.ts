import type { NumbersResultType, NumbersScenario, NumbersStep } from './types';

const COLOR_BOUNDS = {
  red: { min: 0, max: 9 },
  green: { min: 1, max: 8 },
  blue: { min: 2, max: 8 },
  rainbow: { min: 1, max: 8 },
} as const;

type Color = keyof typeof COLOR_BOUNDS;

function clampToBounds(color: Color, value: number) {
  const { min, max } = COLOR_BOUNDS[color];
  return Math.min(Math.max(value, min), max);
}

function cd(color: Color, from: number, to?: number): NumbersStep[] {
  const target = to ?? from;
  const dir = from >= target ? -1 : 1;
  const steps: NumbersStep[] = [];
  for (let i = from; dir === -1 ? i >= target : i <= target; i += dir) {
    const clamped = clampToBounds(color, i);
    steps.push(`cd_${color}_${clamped}` as NumbersStep);
  }
  return steps;
}

function seq(...parts: (NumbersStep | NumbersStep[])[]): NumbersStep[] {
  const flat: NumbersStep[] = [];
  for (const part of parts) {
    if (Array.isArray(part)) {
      flat.push(...part);
    } else {
      flat.push(part);
    }
  }
  return flat;
}

function scenario(
  code: string,
  label: string,
  resultType: NumbersResultType,
  sequence: NumbersStep[],
  finalStage: 'first' | 'second' | 'third' | 'final',
  weight = 10,
  description?: string,
): NumbersScenario {
  return {
    code,
    label,
    resultType,
    sequence,
    finalStage,
    weight,
    description,
  };
}

export const DEFAULT_NUMBERS_SCENARIOS: NumbersScenario[] = [
  // ハズレ
  scenario('S-001', '超早期ハズレ', 'miss', seq(cd('red', 9, 8), 'loser'), 'first'),
  scenario('S-002', '早期ハズレA', 'miss', seq(cd('red', 9, 7), 'loser'), 'first'),
  scenario('S-003', '早期ハズレB', 'miss', seq(cd('red', 9, 6), 'loser'), 'first'),
  scenario('S-004', '中盤ハズレA', 'miss', seq(cd('red', 9, 5), 'loser'), 'first'),
  scenario('S-005', '中盤ハズレB', 'miss', seq(cd('red', 9, 4), 'loser'), 'first'),
  scenario('S-006', '終盤ハズレA', 'miss', seq(cd('red', 9, 3), 'loser'), 'first'),
  scenario('S-007', '終盤ハズレB', 'miss', seq(cd('red', 9, 2), 'loser'), 'first'),
  scenario('S-008', 'フルカウントハズレ', 'miss', seq(cd('red', 9, 0), 'loser'), 'first'),
  scenario('S-009', '昇格後ハズレ(緑)', 'miss', seq(cd('red', 9, 8), 'promotion', cd('green', 7, 5), 'loser'), 'second'),
  scenario('S-010', '昇格後ハズレ(緑フル)', 'miss', seq(cd('red', 9, 8), 'promotion', cd('green', 7, 1), 'loser'), 'second'),
  scenario('S-011', '二段昇格ハズレ(青)', 'miss', seq(cd('red', 9, 8), 'promotion', cd('green', 7, 6), 'promotion', cd('blue', 5, 4), 'loser'), 'third'),
  scenario('S-012', '昇格→降格ハズレ', 'miss', seq(cd('red', 9, 8), 'promotion', cd('green', 7, 6), 'demotion', cd('red', 9, 7), 'loser'), 'first'),
  scenario('S-013', '昇格→降格→昇格ハズレ', 'miss', seq('cd_red_9', 'promotion', 'cd_green_8', 'cd_green_7', 'demotion', cd('red', 9, 8), 'promotion', 'cd_green_7', 'cd_green_6', 'loser'), 'second'),
  scenario('S-014', '敗者のみハズレ', 'miss', seq(cd('red', 9, 4), 'loser'), 'first'),
  scenario('S-015', 'どんでん返しハズレ', 'miss', seq(cd('red', 9, 6), 'loser', 'revival', cd('red', 9, 6), 'loser'), 'first'),

  // 低レア ★1〜★3
  scenario('S-016', '最速当たり★1', 'star1', seq(cd('red', 9, 8), 'puchun'), 'first'),
  scenario('S-017', '赤途中プチュン★1', 'star1', seq(cd('red', 9, 6), 'puchun'), 'first'),
  scenario('S-018', '赤深めプチュン★2', 'star2', seq(cd('red', 9, 3), 'puchun'), 'first'),
  scenario('S-019', '緑即プチュン★2', 'star2', seq(cd('red', 9, 8), 'promotion', 'cd_green_7', 'puchun'), 'second'),
  scenario('S-020', '緑途中プチュン★2', 'star2', seq(cd('red', 9, 8), 'promotion', cd('green', 7, 5), 'puchun'), 'second'),
  scenario('S-021', '昇格→降格→復活★2', 'star2', seq(cd('red', 9, 8), 'promotion', 'cd_green_7', 'demotion', 'cd_red_9', 'loser', 'revival', 'puchun'), 'first'),
  scenario('S-022', '緑深めプチュン★3', 'star3', seq(cd('red', 9, 8), 'promotion', cd('green', 7, 2), 'puchun'), 'second'),
  scenario('S-023', '降格後当たり★3', 'star3', seq('cd_red_9', 'promotion', 'cd_green_8', 'cd_green_7', 'demotion', cd('red', 9, 8), 'puchun'), 'first'),
  scenario('S-024', 'ハズレ偽装→復活★3', 'star3', seq(cd('red', 9, 5), 'loser', 'revival', 'puchun'), 'first'),
  scenario('S-025', '二段昇格青即★3', 'star3', seq('cd_red_9', 'promotion', 'cd_green_8', 'promotion', 'cd_blue_7', 'puchun'), 'third'),

  // 中レア ★4〜★6
  scenario('S-026', '青途中★4', 'star4', seq(cd('red', 9, 8), 'promotion', cd('green', 7, 6), 'promotion', 'cd_blue_5', 'cd_blue_4', 'puchun'), 'third'),
  scenario('S-027', '青カウント★4', 'star4', seq('cd_red_9', 'promotion', 'cd_green_8', 'promotion', cd('blue', 7, 4), 'puchun'), 'third'),
  scenario('S-028', '三段昇格即★5', 'star5', seq('cd_red_9', 'promotion', 'cd_green_8', 'promotion', 'cd_blue_8', 'puchun'), 'third'),
  scenario('S-029', '降格→復活→青★5', 'star5', seq('cd_red_9', 'promotion', 'cd_green_8', 'demotion', 'cd_red_9', 'loser', 'revival', 'cd_red_9', 'promotion', 'cd_green_8', 'promotion', 'cd_blue_7', 'puchun'), 'third'),
  scenario('S-030', '青深めプチュン★5', 'star5', seq('cd_red_9', 'promotion', 'cd_green_8', 'promotion', cd('blue', 7, 2), 'puchun'), 'third'),
  scenario('S-031', 'ジェットコースター青★5', 'star5', seq('cd_red_9', 'promotion', 'cd_green_8', 'demotion', 'cd_red_9', 'promotion', 'cd_green_8', 'promotion', 'cd_blue_7', 'cd_blue_6', 'puchun'), 'third'),
  scenario('S-032', '降格→復活→青★6', 'star6', seq('cd_red_9', 'promotion', 'cd_green_8', 'promotion', 'cd_blue_7', 'cd_blue_6', 'demotion', 'cd_red_9', 'loser', 'revival', 'promotion', 'cd_green_8', 'promotion', 'cd_blue_8', 'puchun'), 'third'),
  scenario('S-033', '三段昇格青深め★6', 'star6', seq(cd('red', 9, 8), 'promotion', cd('green', 7, 6), 'promotion', 'cd_blue_5', 'cd_blue_4', 'cd_blue_3', 'puchun'), 'third'),
  scenario('S-034', '最速三段昇格★6', 'star6', seq('cd_red_9', 'promotion', 'cd_green_8', 'promotion', 'cd_blue_8', 'cd_blue_7', 'puchun'), 'third'),
  scenario('S-035', 'ハズレ偽装2回→青★6', 'star6', seq(cd('red', 9, 6), 'loser', 'revival', cd('red', 9, 6), 'loser', 'revival', 'promotion', 'cd_green_8', 'promotion', 'cd_blue_8', 'puchun'), 'third'),

  // 高レア ★7〜★9
  scenario('S-036', 'レインボー即★7', 'star7', seq('cd_red_9', 'promotion', 'cd_green_8', 'promotion', 'cd_blue_8', 'promotion', 'cd_rainbow_8', 'puchun'), 'final'),
  scenario('S-037', 'レインボー途中★8', 'star8', seq('cd_red_9', 'promotion', 'cd_green_8', 'promotion', 'cd_blue_8', 'promotion', 'cd_rainbow_7', 'cd_rainbow_6', 'cd_rainbow_5', 'puchun'), 'final'),
  scenario('S-038', 'レインボー深め★8', 'star8', seq('cd_red_9', 'promotion', 'cd_green_8', 'promotion', 'cd_blue_8', 'promotion', cd('rainbow', 8, 4), 'puchun'), 'final'),
  scenario('S-039', '降格繰り返し→虹★7', 'star7', seq('cd_red_9', 'promotion', 'cd_green_8', 'demotion', 'cd_red_9', 'promotion', 'cd_green_8', 'promotion', 'cd_blue_7', 'demotion', 'cd_red_9', 'promotion', 'cd_green_8', 'promotion', 'cd_blue_8', 'promotion', 'cd_rainbow_8', 'puchun'), 'final'),
  scenario('S-040', 'ハズレ偽装→虹★8', 'star8', seq(cd('red', 9, 5), 'loser', 'revival', 'promotion', 'cd_green_8', 'promotion', 'cd_blue_8', 'promotion', 'cd_rainbow_7', 'puchun'), 'final'),
  scenario('S-041', 'ジェットコースター最高峰★9', 'star9', seq('cd_red_9', 'promotion', 'cd_green_8', 'demotion', 'cd_red_9', 'promotion', 'cd_green_8', 'promotion', 'cd_blue_8', 'demotion', 'cd_red_9', 'promotion', 'cd_green_8', 'promotion', 'cd_blue_8', 'promotion', 'cd_rainbow_8', 'cd_rainbow_7', 'puchun'), 'final'),
  scenario('S-042', 'ストレートレインボー★9', 'star9', seq('cd_red_9', 'promotion', 'cd_green_8', 'promotion', 'cd_blue_8', 'promotion', 'cd_rainbow_8', 'cd_rainbow_7', 'puchun'), 'final'),
  scenario('S-043', 'レインボーフルカウント★9', 'star9', seq('cd_red_9', 'promotion', 'cd_green_8', 'promotion', 'cd_blue_8', 'promotion', cd('rainbow', 8, 1), 'puchun'), 'final'),

  // 最高レア ★10〜★12
  scenario('S-044', '最速★10', 'star10', seq('cd_red_9', 'puchun'), 'first'),
  scenario('S-045', 'レインボーMAX★10', 'star10', seq('cd_red_9', 'promotion', 'cd_green_8', 'promotion', 'cd_blue_8', 'promotion', 'cd_rainbow_8', 'cd_rainbow_7', 'cd_rainbow_6', 'puchun'), 'final'),
  scenario('S-046', 'ハズレ偽装3回→奇跡★11', 'star11', seq(cd('red', 9, 7), 'loser', 'revival', cd('red', 9, 5), 'loser', 'revival', 'loser', 'revival', 'promotion', 'cd_green_8', 'promotion', 'cd_blue_8', 'promotion', 'cd_rainbow_8', 'puchun'), 'final'),
  scenario('S-047', '完全ストレート昇格★11', 'star11', seq('cd_red_9', 'promotion', 'cd_green_8', 'promotion', 'cd_blue_8', 'promotion', 'cd_rainbow_8', 'puchun'), 'final'),
  scenario('S-048', '降格地獄→最高レア★12', 'star12', seq('cd_red_9', 'promotion', 'cd_green_8', 'demotion', 'cd_red_9', 'promotion', 'cd_green_8', 'demotion', 'cd_red_9', 'promotion', 'cd_green_8', 'promotion', 'cd_blue_7', 'demotion', 'cd_red_9', 'promotion', 'cd_green_8', 'promotion', 'cd_blue_8', 'promotion', 'cd_rainbow_8', 'puchun'), 'final'),
  scenario('S-049', '虹1でプチュン★12', 'star12', seq('cd_red_9', 'promotion', 'cd_green_8', 'promotion', 'cd_blue_8', 'promotion', cd('rainbow', 8, 1), 'puchun'), 'final'),
  scenario('S-050', '究極どんでん返し★12', 'star12', seq(cd('red', 9, 0), 'loser', 'revival', 'promotion', 'cd_green_8', 'promotion', 'cd_blue_8', 'promotion', 'cd_rainbow_8', 'cd_rainbow_7', 'puchun'), 'final'),
];

export function sanitizeScenarioSteps(steps: NumbersStep[]): NumbersStep[] {
  return steps.map((step) => {
    if (typeof step === 'string' && step.startsWith('cd_')) {
      const parts = step.split('_');
      const color = parts[1] as Color;
      const numRaw = Number(parts[2]);
      const clamped = clampToBounds(color, Number.isFinite(numRaw) ? numRaw : COLOR_BOUNDS[color].max);
      return `cd_${color}_${clamped}` as NumbersStep;
    }
    return step;
  });
}

export function withSanitizedScenarios(list: NumbersScenario[]): NumbersScenario[] {
  return list.map((item) => ({
    ...item,
    sequence: sanitizeScenarioSteps(item.sequence),
  }));
}
