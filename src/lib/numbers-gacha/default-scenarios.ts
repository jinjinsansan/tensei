import type { NumbersResultType, NumbersScenario, NumbersStep } from './types';

// ─── カウントダウン範囲定義 ─────────────────────────────
const COLOR_BOUNDS = {
  red:     { min: 0, max: 9 },
  green:   { min: 1, max: 8 },
  blue:    { min: 2, max: 8 },
  rainbow: { min: 1, max: 8 },
} as const;
type Color = keyof typeof COLOR_BOUNDS;

function clamp(color: Color, n: number) {
  const { min, max } = COLOR_BOUNDS[color];
  return Math.min(Math.max(n, min), max);
}

// 必須カウントダウン: 各ステージ開始時の 9(or 8)→4 固定部分
const RED_MANDATORY: NumbersStep[]     = ['cd_red_9','cd_red_8','cd_red_7','cd_red_6','cd_red_5','cd_red_4'];
const GREEN_MANDATORY: NumbersStep[]   = ['cd_green_8','cd_green_7','cd_green_6','cd_green_5','cd_green_4'];
const BLUE_MANDATORY: NumbersStep[]    = ['cd_blue_8','cd_blue_7','cd_blue_6','cd_blue_5','cd_blue_4'];
const RAINBOW_MANDATORY: NumbersStep[] = ['cd_rainbow_8','cd_rainbow_7','cd_rainbow_6','cd_rainbow_5','cd_rainbow_4'];

// カウントダウン続き(4以降の任意部分)
function cdr(from: number, to: number): NumbersStep[] {
  const steps: NumbersStep[] = [];
  for (let i = from; i >= to; i--) steps.push(`cd_red_${clamp('red', i)}` as NumbersStep);
  return steps;
}
function cdg(from: number, to: number): NumbersStep[] {
  const steps: NumbersStep[] = [];
  for (let i = from; i >= to; i--) steps.push(`cd_green_${clamp('green', i)}` as NumbersStep);
  return steps;
}
function cdb(from: number, to: number): NumbersStep[] {
  const steps: NumbersStep[] = [];
  for (let i = from; i >= to; i--) steps.push(`cd_blue_${clamp('blue', i)}` as NumbersStep);
  return steps;
}
function cdrow(from: number, to: number): NumbersStep[] {
  const steps: NumbersStep[] = [];
  for (let i = from; i >= to; i--) steps.push(`cd_rainbow_${clamp('rainbow', i)}` as NumbersStep);
  return steps;
}

function seq(...parts: (NumbersStep | NumbersStep[])[]): NumbersStep[] {
  return parts.flat() as NumbersStep[];
}

function scenario(
  code: string, label: string, resultType: NumbersResultType,
  sequence: NumbersStep[], finalStage: 'first'|'second'|'third'|'final',
  weight = 10, description?: string,
): NumbersScenario {
  return { code, label, resultType, sequence, finalStage, weight, description };
}

// 昇格映像は2種交互に使う
const PA: NumbersStep = 'promotion_a';   // 修正版昇格確定映像
const PB: NumbersStep = 'patlite';       // 修正版パトライト映像

export const DEFAULT_NUMBERS_SCENARIOS: NumbersScenario[] = [

  // ══════════════════════════════════════════════════
  // MISS (S-001〜S-018)  ハズレ — 赤ステージのみ・昇格なし中心
  // ══════════════════════════════════════════════════
  // 赤4で即失敗
  scenario('S-001','超早期失敗','miss',
    seq('standby_red','title',...RED_MANDATORY,'cd_red_3','challenge_fail','loser'),'first',14),
  // 赤3で失敗
  scenario('S-002','早期失敗A','miss',
    seq('standby_red','title',...RED_MANDATORY,'cd_red_3','cd_red_2','challenge_fail','loser'),'first',13),
  // 赤2で失敗
  scenario('S-003','早期失敗B','miss',
    seq('standby_blue','title',...RED_MANDATORY,'cd_red_3','cd_red_2','challenge_fail','loser'),'first',12),
  // 赤1まで引っ張って失敗
  scenario('S-004','フルカウント失敗A','miss',
    seq('standby_red','title',...RED_MANDATORY,'cd_red_3','cd_red_2','cd_red_1','challenge_fail','loser'),'first',12),
  scenario('S-005','フルカウント失敗B','miss',
    seq('standby_blue','title',...RED_MANDATORY,'cd_red_3','cd_red_2','cd_red_1','challenge_fail','loser'),'first',11),
  scenario('S-006','フルカウント失敗C','miss',
    seq('standby_white','title',...RED_MANDATORY,'cd_red_3','cd_red_2','cd_red_1','challenge_fail','loser'),'first',10),
  // 復活後そのまま失敗 (どんでん返しなし)
  scenario('S-007','復活→即失敗','miss',
    seq('standby_red','title',...RED_MANDATORY,'cd_red_3','challenge_fail','revival_1',...RED_MANDATORY,'cd_red_3','cd_red_2','challenge_fail','loser'),'first',8),
  scenario('S-008','復活フル→失敗','miss',
    seq('standby_blue','title',...RED_MANDATORY,'cd_red_3','cd_red_2','cd_red_1','challenge_fail','revival_1',...RED_MANDATORY,'cd_red_3','cd_red_2','cd_red_1','challenge_fail','loser'),'first',7),
  // 2回復活→失敗 (激しいどんでん返し見せ場のあとハズレ)
  scenario('S-009','2度復活→失敗','miss',
    seq('standby_yellow','title',...RED_MANDATORY,'cd_red_3','challenge_fail','revival_1',...RED_MANDATORY,'cd_red_3','challenge_fail','revival_1',...RED_MANDATORY,'cd_red_3','cd_red_2','cd_red_1','challenge_fail','loser'),'first',6),
  // 偽希望: 緑まで昇格したが失敗
  scenario('S-010','昇格→緑失敗A','miss',
    seq('standby_yellow','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3','challenge_fail','loser'),'second',5),
  scenario('S-011','昇格→緑フル失敗','miss',
    seq('standby_blue','title',...RED_MANDATORY,'cd_red_3',PB,...GREEN_MANDATORY,'cd_green_3','cd_green_2','cd_green_1','challenge_fail','loser'),'second',5),
  // 降格から最下層へ落ちて失敗
  scenario('S-012','降格最下層失敗','miss',
    seq('standby_black','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3','demotion_full',...RED_MANDATORY,'cd_red_3','cd_red_2','cd_red_1','challenge_fail','loser'),'first',4),
  // パトライト偽希望
  scenario('S-013','パトライト偽希望失敗','miss',
    seq('standby_yellow','title',...RED_MANDATORY,'cd_red_3',PB,...GREEN_MANDATORY,'cd_green_3',PA,...BLUE_MANDATORY,'cd_blue_3','challenge_fail','loser'),'third',3),
  // 青まで上がって失敗
  scenario('S-014','青失敗','miss',
    seq('standby_white','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3',PB,...BLUE_MANDATORY,'cd_blue_3','cd_blue_2','challenge_fail','loser'),'third',3),
  // 最下層一気落ち×2
  scenario('S-015','ジェットコースター失敗','miss',
    seq('standby_black','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3',PB,...BLUE_MANDATORY,'cd_blue_3','demotion_full',...RED_MANDATORY,'cd_red_3','cd_red_2','cd_red_1','challenge_fail','loser'),'first',3),
  // 地獄の連続失敗
  scenario('S-016','連続失敗ハズレ','miss',
    seq('standby_black','title',...RED_MANDATORY,'cd_red_3','challenge_fail','revival_1',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3','challenge_fail','loser'),'second',2),
  scenario('S-017','最後の最後で失敗','miss',
    seq('standby_red','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3',PB,...BLUE_MANDATORY,'cd_blue_3','challenge_fail','revival_1',...RED_MANDATORY,'cd_red_3','cd_red_2','cd_red_1','challenge_fail','loser'),'first',2),
  scenario('S-018','虹前失敗','miss',
    seq('standby_yellow','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3',PB,...BLUE_MANDATORY,'cd_blue_3',PA,...RAINBOW_MANDATORY,'cd_rainbow_3','challenge_fail','loser'),'final',2),

  // ══════════════════════════════════════════════════
  // ★1 (S-019〜S-021) 赤ステージ即プチュン・早め
  // ══════════════════════════════════════════════════
  scenario('S-019','赤3プチュン★1','star1',
    seq('standby_red','title',...RED_MANDATORY,'cd_red_3','puchun'),'first',15),
  scenario('S-020','赤3早めプチュン★1','star1',
    seq('standby_blue','title',...RED_MANDATORY,'cd_red_3','puchun'),'first',13),
  scenario('S-021','赤2プチュン★1','star1',
    seq('standby_white','title',...RED_MANDATORY,'cd_red_3','cd_red_2','puchun'),'first',10),

  // ══════════════════════════════════════════════════
  // ★2 (S-022〜S-025)
  // ══════════════════════════════════════════════════
  scenario('S-022','赤2深プチュン★2','star2',
    seq('standby_red','title',...RED_MANDATORY,'cd_red_3','cd_red_2','puchun'),'first',12),
  scenario('S-023','赤1プチュン★2','star2',
    seq('standby_blue','title',...RED_MANDATORY,'cd_red_3','cd_red_2','cd_red_1','puchun'),'first',10),
  scenario('S-024','復活→赤プチュン★2','star2',
    seq('standby_red','title',...RED_MANDATORY,'cd_red_3','challenge_fail','revival_1',...RED_MANDATORY,'cd_red_3','puchun'),'first',8),
  scenario('S-025','パトライト復活★2','star2',
    seq('standby_yellow','title',...RED_MANDATORY,'cd_red_3','cd_red_2','challenge_fail','patlite',...RED_MANDATORY,'cd_red_3','cd_red_2','puchun'),'first',7),

  // ══════════════════════════════════════════════════
  // ★3 (S-026〜S-030)
  // ══════════════════════════════════════════════════
  scenario('S-026','赤1プチュン★3','star3',
    seq('standby_blue','title',...RED_MANDATORY,'cd_red_3','cd_red_2','cd_red_1','puchun'),'first',12),
  scenario('S-027','虹復活→赤プチュン★3','star3',
    seq('standby_rainbow','title',...RED_MANDATORY,'cd_red_3','cd_red_2','cd_red_1','challenge_fail','revival_3',...RED_MANDATORY,'cd_red_3','puchun'),'first',8),
  scenario('S-028','緑即プチュン★3','star3',
    seq('standby_blue','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3','puchun'),'second',9),
  scenario('S-029','緑早めプチュン★3','star3',
    seq('standby_white','title',...RED_MANDATORY,'cd_red_3',PB,...GREEN_MANDATORY,'cd_green_3','puchun'),'second',8),
  scenario('S-030','降格→復活→緑★3','star3',
    seq('standby_yellow','title',...RED_MANDATORY,'cd_red_3','challenge_fail','revival_1',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3','puchun'),'second',7),

  // ══════════════════════════════════════════════════
  // ★4 (S-031〜S-035)
  // ══════════════════════════════════════════════════
  scenario('S-031','緑2プチュン★4','star4',
    seq('standby_white','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3','cd_green_2','puchun'),'second',11),
  scenario('S-032','緑1プチュン★4','star4',
    seq('standby_blue','title',...RED_MANDATORY,'cd_red_3',PB,...GREEN_MANDATORY,'cd_green_3','cd_green_2','cd_green_1','puchun'),'second',9),
  scenario('S-033','復活→緑プチュン★4','star4',
    seq('standby_yellow','title',...RED_MANDATORY,'cd_red_3','cd_red_2','challenge_fail','revival_1',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3','cd_green_2','puchun'),'second',8),
  scenario('S-034','パトライト復活→緑★4','star4',
    seq('standby_rainbow','title',...RED_MANDATORY,'cd_red_3','cd_red_2','cd_red_1','challenge_fail','patlite',...RED_MANDATORY,'cd_red_3',PB,...GREEN_MANDATORY,'cd_green_3','puchun'),'second',7),
  scenario('S-035','降格→再昇格→緑★4','star4',
    seq('standby_blue','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3','challenge_fail',...RED_MANDATORY,'cd_red_3',PB,...GREEN_MANDATORY,'cd_green_3','cd_green_2','puchun'),'second',6),

  // ══════════════════════════════════════════════════
  // ★5 (S-036〜S-041)
  // ══════════════════════════════════════════════════
  scenario('S-036','青即プチュン★5','star5',
    seq('standby_white','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3',PB,...BLUE_MANDATORY,'cd_blue_3','puchun'),'third',10),
  scenario('S-037','青2プチュン★5','star5',
    seq('standby_yellow','title',...RED_MANDATORY,'cd_red_3',PB,...GREEN_MANDATORY,'cd_green_3',PA,...BLUE_MANDATORY,'cd_blue_3','cd_blue_2','puchun'),'third',9),
  scenario('S-038','緑深め→青★5','star5',
    seq('standby_blue','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,...cdg(3,2),PB,...BLUE_MANDATORY,'cd_blue_3','puchun'),'third',8),
  scenario('S-039','降格→復活→青★5','star5',
    seq('standby_yellow','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3','challenge_fail','revival_1',...RED_MANDATORY,'cd_red_3',PB,...GREEN_MANDATORY,'cd_green_3',PA,...BLUE_MANDATORY,'cd_blue_3','puchun'),'third',7),
  scenario('S-040','虹復活→青プチュン★5','star5',
    seq('standby_rainbow','title',...RED_MANDATORY,'cd_red_3','cd_red_2','cd_red_1','challenge_fail','revival_3',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3',PB,...BLUE_MANDATORY,'cd_blue_3','puchun'),'third',6),
  scenario('S-041','最下層落→青★5','star5',
    seq('standby_black','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3',PB,...BLUE_MANDATORY,'cd_blue_3','demotion_full',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3',PB,...BLUE_MANDATORY,'cd_blue_3','puchun'),'third',5),

  // ══════════════════════════════════════════════════
  // ★6 (S-042〜S-047)
  // ══════════════════════════════════════════════════
  scenario('S-042','青1プチュン★6','star6',
    seq('standby_white','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3',PB,...BLUE_MANDATORY,'cd_blue_3','cd_blue_2','cd_blue_1','puchun'),'third',10),
  scenario('S-043','青深めプチュン★6','star6',
    seq('standby_blue','title',...RED_MANDATORY,'cd_red_3',PB,...GREEN_MANDATORY,'cd_green_3',PA,...BLUE_MANDATORY,...cdb(3,2),'puchun'),'third',9),
  scenario('S-044','昇格2回→青深め★6','star6',
    seq('standby_yellow','title',...RED_MANDATORY,'cd_red_2',PA,...GREEN_MANDATORY,'cd_green_2',PB,...BLUE_MANDATORY,'cd_blue_3','cd_blue_2','puchun'),'third',8),
  scenario('S-045','復活→青★6','star6',
    seq('standby_rainbow','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3','challenge_fail','revival_1',...RED_MANDATORY,'cd_red_3',PB,...GREEN_MANDATORY,'cd_green_3',PA,...BLUE_MANDATORY,'cd_blue_3','cd_blue_2','puchun'),'third',7),
  scenario('S-046','パトライト2連昇格→青★6','star6',
    seq('standby_rainbow','title',...RED_MANDATORY,'cd_red_3',PB,...GREEN_MANDATORY,'cd_green_3',PB,...BLUE_MANDATORY,'cd_blue_3','cd_blue_2','cd_blue_1','puchun'),'third',7),
  scenario('S-047','最下層落→青深め★6','star6',
    seq('standby_black','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3',PB,'demotion_full',...RED_MANDATORY,'cd_red_3',PB,...GREEN_MANDATORY,'cd_green_3',PA,...BLUE_MANDATORY,'cd_blue_3','cd_blue_2','puchun'),'third',5),

  // ══════════════════════════════════════════════════
  // ★7 (S-048〜S-053) 虹ステージへ (昇格3回)
  // ══════════════════════════════════════════════════
  scenario('S-048','虹即プチュン★7','star7',
    seq('standby_rainbow','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3',PB,...BLUE_MANDATORY,'cd_blue_3',PA,...RAINBOW_MANDATORY,'cd_rainbow_3','puchun'),'final',10),
  scenario('S-049','虹2プチュン★7','star7',
    seq('standby_rainbow','title',...RED_MANDATORY,'cd_red_3',PB,...GREEN_MANDATORY,'cd_green_3',PA,...BLUE_MANDATORY,'cd_blue_3',PB,...RAINBOW_MANDATORY,'cd_rainbow_3','cd_rainbow_2','puchun'),'final',9),
  scenario('S-050','パトライト昇格→虹★7','star7',
    seq('standby_yellow','title',...RED_MANDATORY,'cd_red_3',PB,...GREEN_MANDATORY,'cd_green_3',PB,...BLUE_MANDATORY,'cd_blue_3',PB,...RAINBOW_MANDATORY,'cd_rainbow_3','puchun'),'final',8),
  scenario('S-051','復活→虹★7','star7',
    seq('standby_rainbow','title',...RED_MANDATORY,'cd_red_3','cd_red_2','challenge_fail','revival_1',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3',PB,...BLUE_MANDATORY,'cd_blue_3',PA,...RAINBOW_MANDATORY,'cd_rainbow_3','puchun'),'final',7),
  scenario('S-052','降格最下層→虹★7','star7',
    seq('standby_black','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3',PB,...BLUE_MANDATORY,'cd_blue_3','demotion_full',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3',PB,...BLUE_MANDATORY,'cd_blue_3',PA,...RAINBOW_MANDATORY,'cd_rainbow_3','puchun'),'final',5),
  scenario('S-053','ジェットコースター虹★7','star7',
    seq('standby_black','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3','challenge_fail',...RED_MANDATORY,'cd_red_3',PB,...GREEN_MANDATORY,'cd_green_3',PA,...BLUE_MANDATORY,'cd_blue_3',PB,...RAINBOW_MANDATORY,'cd_rainbow_3','puchun'),'final',6),

  // ══════════════════════════════════════════════════
  // ★8 (S-054〜S-058)
  // ══════════════════════════════════════════════════
  scenario('S-054','虹3プチュン★8','star8',
    seq('standby_rainbow','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3',PB,...BLUE_MANDATORY,'cd_blue_3',PA,...RAINBOW_MANDATORY,'cd_rainbow_3','cd_rainbow_2','cd_rainbow_1','puchun'),'final',9),
  scenario('S-055','虹2深め★8','star8',
    seq('standby_rainbow','title',...RED_MANDATORY,'cd_red_2',PB,...GREEN_MANDATORY,'cd_green_2',PA,...BLUE_MANDATORY,'cd_blue_2',PB,...RAINBOW_MANDATORY,'cd_rainbow_3','cd_rainbow_2','puchun'),'final',8),
  scenario('S-056','虹復活→虹★8','star8',
    seq('standby_rainbow','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3',PB,...BLUE_MANDATORY,'cd_blue_3','challenge_fail','revival_3',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3',PB,...BLUE_MANDATORY,'cd_blue_3',PA,...RAINBOW_MANDATORY,'cd_rainbow_3','cd_rainbow_2','puchun'),'final',6),
  scenario('S-057','最下層×2→虹★8','star8',
    seq('standby_black','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3',PB,...BLUE_MANDATORY,'cd_blue_3','demotion_full',...RED_MANDATORY,'cd_red_3',PB,...GREEN_MANDATORY,'cd_green_3',PA,...BLUE_MANDATORY,'cd_blue_3',PB,...RAINBOW_MANDATORY,'cd_rainbow_3','cd_rainbow_2','puchun'),'final',5),
  scenario('S-058','パトライト復活→虹★8','star8',
    seq('standby_rainbow','title',...RED_MANDATORY,'cd_red_3','cd_red_2','cd_red_1','challenge_fail','patlite',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3',PB,...BLUE_MANDATORY,'cd_blue_3',PA,...RAINBOW_MANDATORY,'cd_rainbow_3','puchun'),'final',6),

  // ══════════════════════════════════════════════════
  // ★9 (S-059〜S-063)
  // ══════════════════════════════════════════════════
  scenario('S-059','虹フルカウント★9','star9',
    seq('standby_rainbow','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3',PB,...BLUE_MANDATORY,'cd_blue_3',PA,...RAINBOW_MANDATORY,...cdrow(3,1),'puchun'),'final',8),
  scenario('S-060','ストレート3昇格★9','star9',
    seq('standby_rainbow','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3',PA,...BLUE_MANDATORY,'cd_blue_3',PA,...RAINBOW_MANDATORY,'cd_rainbow_3','cd_rainbow_2','cd_rainbow_1','puchun'),'final',7),
  scenario('S-061','どんでん返し→虹フル★9','star9',
    seq('standby_rainbow','title',...RED_MANDATORY,'cd_red_3',PB,...GREEN_MANDATORY,'cd_green_3',PA,...BLUE_MANDATORY,'cd_blue_3',PB,...RAINBOW_MANDATORY,...cdrow(3,1),'puchun'),'final',7),
  scenario('S-062','地獄→虹★9','star9',
    seq('standby_black','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3','demotion_full',...RED_MANDATORY,'cd_red_3',PB,...GREEN_MANDATORY,'cd_green_3',PA,...BLUE_MANDATORY,'cd_blue_3',PB,...RAINBOW_MANDATORY,'cd_rainbow_3','cd_rainbow_2','cd_rainbow_1','puchun'),'final',5),
  scenario('S-063','虹色復活→虹フル★9','star9',
    seq('standby_rainbow','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3',PB,...BLUE_MANDATORY,'cd_blue_3','challenge_fail','revival_3',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3',PB,...BLUE_MANDATORY,'cd_blue_3',PA,...RAINBOW_MANDATORY,...cdrow(3,1),'puchun'),'final',4),

  // ══════════════════════════════════════════════════
  // ★10 (S-064〜S-067)
  // ══════════════════════════════════════════════════
  scenario('S-064','奇跡の赤即プチュン★10','star10',
    seq('standby_rainbow','title',...RED_MANDATORY,'cd_red_3','puchun','win_confirm'),'first',12),
  scenario('S-065','虹フル→勝利確定★10','star10',
    seq('standby_rainbow','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3',PB,...BLUE_MANDATORY,'cd_blue_3',PA,...RAINBOW_MANDATORY,'cd_rainbow_3','cd_rainbow_2','puchun','win_confirm'),'final',9),
  scenario('S-066','パトライト全昇格★10','star10',
    seq('standby_rainbow','title',...RED_MANDATORY,'cd_red_2',PB,...GREEN_MANDATORY,'cd_green_2',PB,...BLUE_MANDATORY,'cd_blue_2',PB,...RAINBOW_MANDATORY,'cd_rainbow_3','cd_rainbow_2','puchun','win_confirm'),'final',8),
  scenario('S-067','虹色復活→★10','star10',
    seq('standby_rainbow','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3',PB,...BLUE_MANDATORY,'cd_blue_3','challenge_fail','revival_3',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3',PB,...BLUE_MANDATORY,'cd_blue_3',PA,...RAINBOW_MANDATORY,'cd_rainbow_3','puchun','win_confirm'),'final',6),

  // ══════════════════════════════════════════════════
  // ★11 (S-068〜S-071)
  // ══════════════════════════════════════════════════
  scenario('S-068','赤即プチュン★11','star11',
    seq('standby_rainbow','title',...RED_MANDATORY,'cd_red_3','puchun','win_confirm'),'first',9),
  scenario('S-069','虹フルカウント★11','star11',
    seq('standby_rainbow','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3',PB,...BLUE_MANDATORY,'cd_blue_3',PA,...RAINBOW_MANDATORY,...cdrow(3,1),'puchun','win_confirm'),'final',8),
  scenario('S-070','地獄脱出→★11','star11',
    seq('standby_black','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3','demotion_full',...RED_MANDATORY,'cd_red_3',PB,...GREEN_MANDATORY,'cd_green_3',PA,...BLUE_MANDATORY,'cd_blue_3',PB,...RAINBOW_MANDATORY,...cdrow(3,1),'puchun','win_confirm'),'final',5),
  scenario('S-071','2度復活→★11','star11',
    seq('standby_rainbow','title',...RED_MANDATORY,'cd_red_3','challenge_fail','revival_1',...RED_MANDATORY,'cd_red_3','challenge_fail','revival_3',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3',PB,...BLUE_MANDATORY,'cd_blue_3',PA,...RAINBOW_MANDATORY,'cd_rainbow_3','puchun','win_confirm'),'final',5),

  // ══════════════════════════════════════════════════
  // ★12 (S-072〜S-075) 最高レア
  // ══════════════════════════════════════════════════
  scenario('S-072','最速奇跡★12','star12',
    seq('standby_rainbow','title',...RED_MANDATORY,'cd_red_3','puchun','win_confirm'),'first',6),
  scenario('S-073','虹フル伝説★12','star12',
    seq('standby_rainbow','title',...RED_MANDATORY,'cd_red_2',PA,...GREEN_MANDATORY,'cd_green_2',PB,...BLUE_MANDATORY,'cd_blue_2',PA,...RAINBOW_MANDATORY,...cdrow(3,1),'puchun','win_confirm'),'final',6),
  scenario('S-074','地獄×3→★12','star12',
    seq('standby_black','title',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3','demotion_full',...RED_MANDATORY,'cd_red_3',PB,...GREEN_MANDATORY,'cd_green_3',PA,...BLUE_MANDATORY,'cd_blue_3','demotion_full',...RED_MANDATORY,'cd_red_3',PB,...GREEN_MANDATORY,'cd_green_3',PA,...BLUE_MANDATORY,'cd_blue_3',PB,...RAINBOW_MANDATORY,...cdrow(3,1),'puchun','win_confirm'),'final',4),
  scenario('S-075','虹色3連復活→★12','star12',
    seq('standby_rainbow','title',...RED_MANDATORY,'cd_red_3','challenge_fail','revival_3',...RED_MANDATORY,'cd_red_3','challenge_fail','revival_3',...RED_MANDATORY,'cd_red_3',PA,...GREEN_MANDATORY,'cd_green_3',PB,...BLUE_MANDATORY,'cd_blue_3',PA,...RAINBOW_MANDATORY,...cdrow(3,1),'puchun','win_confirm'),'final',4),
];

// ─── sanitize ─────────────────────────────────────────
export function sanitizeScenarioSteps(steps: NumbersStep[]): NumbersStep[] {
  return steps.map((step) => {
    if (typeof step === 'string' && step.startsWith('cd_')) {
      const parts = step.split('_');
      const color = parts[1] as Color;
      const numRaw = Number(parts[2]);
      const bounds = COLOR_BOUNDS[color];
      if (!bounds) return step;
      const clamped = Number.isFinite(numRaw) ? Math.min(Math.max(numRaw, bounds.min), bounds.max) : bounds.max;
      return `cd_${color}_${clamped}` as NumbersStep;
    }
    return step;
  });
}

export function withSanitizedScenarios(list: NumbersScenario[]): NumbersScenario[] {
  return list.map((item) => ({ ...item, sequence: sanitizeScenarioSteps(item.sequence) }));
}
