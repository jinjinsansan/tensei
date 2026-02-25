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
const RM: NumbersStep[]  = ['cd_red_9','cd_red_8','cd_red_7','cd_red_6','cd_red_5','cd_red_4'];
const GM: NumbersStep[]  = ['cd_green_8','cd_green_7','cd_green_6','cd_green_5','cd_green_4'];
const BM: NumbersStep[]  = ['cd_blue_8','cd_blue_7','cd_blue_6','cd_blue_5','cd_blue_4'];
const RBM: NumbersStep[] = ['cd_rainbow_8','cd_rainbow_7','cd_rainbow_6','cd_rainbow_5','cd_rainbow_4'];

// カウントダウン任意部分 (必ず連番・スキップ禁止)
function cdr(from: number, to: number): NumbersStep[] {
  const s: NumbersStep[] = [];
  for (let i = from; i >= to; i--) s.push(`cd_red_${clamp('red', i)}` as NumbersStep);
  return s;
}
function cdg(from: number, to: number): NumbersStep[] {
  const s: NumbersStep[] = [];
  for (let i = from; i >= to; i--) s.push(`cd_green_${clamp('green', i)}` as NumbersStep);
  return s;
}
function cdb(from: number, to: number): NumbersStep[] {
  const s: NumbersStep[] = [];
  // blue min=2 なので1には行かない
  for (let i = from; i >= Math.max(to, 2); i--) s.push(`cd_blue_${clamp('blue', i)}` as NumbersStep);
  return s;
}
function cdrw(from: number, to: number): NumbersStep[] {
  const s: NumbersStep[] = [];
  for (let i = from; i >= to; i--) s.push(`cd_rainbow_${clamp('rainbow', i)}` as NumbersStep);
  return s;
}

function seq(...parts: (NumbersStep | NumbersStep[])[]): NumbersStep[] {
  return parts.flat() as NumbersStep[];
}

const PA: NumbersStep = 'promotion_a';
const PB: NumbersStep = 'patlite';

function scenario(
  code: string, label: string, resultType: NumbersResultType,
  sequence: NumbersStep[], finalStage: 'first'|'second'|'third'|'final',
  weight = 10,
): NumbersScenario {
  return { code, label, resultType, sequence, finalStage, weight };
}

// ─── ルール ────────────────────────────────────────────
// 1. 必ず 9→4 (RM) から開始、4以降に昇格/失敗イベント
// 2. カウントダウンは必ず連番 (4→3→2→1、スキップ禁止)
// 3. puchun の後は必ず win_confirm
// 4. challenge_fail + revival_* → 必ず次の上のステージへ
//    (red失敗→green, green失敗→blue, blue失敗→rainbow)
// 5. demotion_full → 一気に first stage (red) へ (意図的な降格)
// ───────────────────────────────────────────────────────

export const DEFAULT_NUMBERS_SCENARIOS: NumbersScenario[] = [

  // ══════════════════════════════════════════════════
  // MISS (S-001〜S-018)
  // ══════════════════════════════════════════════════
  scenario('S-001','超早期失敗','miss',
    seq('standby_red','title',...RM,...cdr(3,3),'challenge_fail','loser'),'first',14),
  scenario('S-002','早期失敗A','miss',
    seq('standby_red','title',...RM,...cdr(3,2),'challenge_fail','loser'),'first',13),
  scenario('S-003','早期失敗B','miss',
    seq('standby_blue','title',...RM,...cdr(3,2),'challenge_fail','loser'),'first',12),
  scenario('S-004','フルカウント失敗A','miss',
    seq('standby_red','title',...RM,...cdr(3,1),'challenge_fail','loser'),'first',12),
  scenario('S-005','フルカウント失敗B','miss',
    seq('standby_blue','title',...RM,...cdr(3,1),'challenge_fail','loser'),'first',11),
  scenario('S-006','フルカウント失敗C','miss',
    seq('standby_white','title',...RM,...cdr(3,1),'challenge_fail','loser'),'first',10),
  // 復活→次ステージ(green)→失敗
  scenario('S-007','復活→緑失敗','miss',
    seq('standby_red','title',...RM,...cdr(3,3),'challenge_fail','revival_1',...GM,...cdg(3,2),'challenge_fail','loser'),'second',8),
  scenario('S-008','復活フル→緑失敗','miss',
    seq('standby_blue','title',...RM,...cdr(3,1),'challenge_fail','revival_1',...GM,...cdg(3,1),'challenge_fail','loser'),'second',7),
  // 2度復活: red失敗→green→green失敗→blue→blue失敗→loser
  scenario('S-009','2度復活→失敗','miss',
    seq('standby_yellow','title',...RM,...cdr(3,3),'challenge_fail','revival_1',...GM,...cdg(3,3),'challenge_fail','revival_1',...BM,...cdb(3,2),'challenge_fail','loser'),'third',6),
  // 昇格→緑失敗
  scenario('S-010','昇格→緑失敗','miss',
    seq('standby_yellow','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,3),'challenge_fail','loser'),'second',5),
  scenario('S-011','昇格→緑フル失敗','miss',
    seq('standby_blue','title',...RM,...cdr(3,3),PB,...GM,...cdg(3,1),'challenge_fail','loser'),'second',5),
  // 降格最下層→失敗
  scenario('S-012','降格最下層失敗','miss',
    seq('standby_black','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,3),'demotion_full',...RM,...cdr(3,1),'challenge_fail','loser'),'first',4),
  // 2昇格→青失敗
  scenario('S-013','昇格2回→青失敗','miss',
    seq('standby_yellow','title',...RM,...cdr(3,3),PB,...GM,...cdg(3,3),PA,...BM,...cdb(3,3),'challenge_fail','loser'),'third',3),
  scenario('S-014','青2失敗','miss',
    seq('standby_white','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,3),PB,...BM,...cdb(3,2),'challenge_fail','loser'),'third',3),
  // 降格→失敗
  scenario('S-015','ジェットコースター失敗','miss',
    seq('standby_black','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,3),PB,...BM,...cdb(3,3),'demotion_full',...RM,...cdr(3,1),'challenge_fail','loser'),'first',3),
  // 復活→green→促進→blue失敗
  scenario('S-016','復活→昇格→青失敗','miss',
    seq('standby_black','title',...RM,...cdr(3,3),'challenge_fail','revival_1',...GM,...cdg(3,3),PA,...BM,...cdb(3,3),'challenge_fail','loser'),'third',2),
  // blue失敗→復活→rainbow→失敗
  scenario('S-017','虹まで届いて失敗','miss',
    seq('standby_red','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,3),PB,...BM,...cdb(3,3),'challenge_fail','revival_1',...RBM,...cdrw(3,3),'challenge_fail','loser'),'final',2),
  // 虹まで昇格して失敗(復活なし)
  scenario('S-018','虹前失敗','miss',
    seq('standby_yellow','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,3),PB,...BM,...cdb(3,3),PA,...RBM,...cdrw(3,3),'challenge_fail','loser'),'final',2),

  // ══════════════════════════════════════════════════
  // ★1 (S-019〜S-021) 赤3でプチュン
  // ══════════════════════════════════════════════════
  scenario('S-019','赤3プチュン★1','star1',
    seq('standby_red','title',...RM,...cdr(3,3),'puchun','win_confirm'),'first',15),
  scenario('S-020','赤3早め★1','star1',
    seq('standby_blue','title',...RM,...cdr(3,3),'puchun','win_confirm'),'first',13),
  scenario('S-021','赤3白スタンバイ★1','star1',
    seq('standby_white','title',...RM,...cdr(3,3),'puchun','win_confirm'),'first',10),

  // ══════════════════════════════════════════════════
  // ★2 (S-022〜S-024) 赤2でプチュン
  // ══════════════════════════════════════════════════
  scenario('S-022','赤2プチュン★2','star2',
    seq('standby_red','title',...RM,...cdr(3,2),'puchun','win_confirm'),'first',12),
  scenario('S-023','赤2早め★2','star2',
    seq('standby_blue','title',...RM,...cdr(3,2),'puchun','win_confirm'),'first',10),
  scenario('S-024','赤2黄スタンバイ★2','star2',
    seq('standby_yellow','title',...RM,...cdr(3,2),'puchun','win_confirm'),'first',8),

  // ══════════════════════════════════════════════════
  // ★3 (S-025〜S-030) 赤1プチュン or 緑3プチュン
  // ══════════════════════════════════════════════════
  scenario('S-025','赤1プチュン★3','star3',
    seq('standby_blue','title',...RM,...cdr(3,1),'puchun','win_confirm'),'first',12),
  scenario('S-026','赤1虹スタンバイ★3','star3',
    seq('standby_rainbow','title',...RM,...cdr(3,1),'puchun','win_confirm'),'first',10),
  // 赤失敗→復活→緑3プチュン
  scenario('S-027','虹復活→緑プチュン★3','star3',
    seq('standby_rainbow','title',...RM,...cdr(3,1),'challenge_fail','revival_3',...GM,...cdg(3,3),'puchun','win_confirm'),'second',8),
  // 昇格→緑3プチュン
  scenario('S-028','緑即プチュン★3','star3',
    seq('standby_blue','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,3),'puchun','win_confirm'),'second',9),
  scenario('S-029','緑即パトライト★3','star3',
    seq('standby_white','title',...RM,...cdr(3,3),PB,...GM,...cdg(3,3),'puchun','win_confirm'),'second',8),
  // 赤失敗→復活→緑3プチュン
  scenario('S-030','復活→緑プチュン★3','star3',
    seq('standby_yellow','title',...RM,...cdr(3,3),'challenge_fail','revival_1',...GM,...cdg(3,3),'puchun','win_confirm'),'second',7),

  // ══════════════════════════════════════════════════
  // ★4 (S-031〜S-035) 緑2プチュン
  // ══════════════════════════════════════════════════
  scenario('S-031','緑2プチュン★4','star4',
    seq('standby_white','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,2),'puchun','win_confirm'),'second',11),
  scenario('S-032','緑2パトライト★4','star4',
    seq('standby_blue','title',...RM,...cdr(3,3),PB,...GM,...cdg(3,2),'puchun','win_confirm'),'second',9),
  // 赤2失敗→復活→緑2プチュン
  scenario('S-033','復活→緑2プチュン★4','star4',
    seq('standby_yellow','title',...RM,...cdr(3,2),'challenge_fail','revival_1',...GM,...cdg(3,2),'puchun','win_confirm'),'second',8),
  // 赤1失敗→パトライト復活→緑2プチュン
  scenario('S-034','パトライト復活→緑★4','star4',
    seq('standby_rainbow','title',...RM,...cdr(3,1),'challenge_fail','patlite',...GM,...cdg(3,2),'puchun','win_confirm'),'second',7),
  // 緑失敗→降格(demotion)→再昇格→緑2プチュン
  scenario('S-035','降格→再昇格→緑2★4','star4',
    seq('standby_blue','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,3),'challenge_fail',...RM,...cdr(3,3),PB,...GM,...cdg(3,2),'puchun','win_confirm'),'second',6),

  // ══════════════════════════════════════════════════
  // ★5 (S-036〜S-041) 緑1プチュン or 青3プチュン
  // ══════════════════════════════════════════════════
  scenario('S-036','緑1プチュン★5','star5',
    seq('standby_white','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,1),'puchun','win_confirm'),'second',10),
  scenario('S-037','青3プチュン★5','star5',
    seq('standby_yellow','title',...RM,...cdr(3,3),PB,...GM,...cdg(3,3),PA,...BM,...cdb(3,3),'puchun','win_confirm'),'third',9),
  // 緑深め→青3プチュン
  scenario('S-038','緑深め→青プチュン★5','star5',
    seq('standby_blue','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,2),PB,...BM,...cdb(3,3),'puchun','win_confirm'),'third',8),
  // 緑失敗→復活→青3プチュン
  scenario('S-039','緑失敗→復活→青★5','star5',
    seq('standby_yellow','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,3),'challenge_fail','revival_1',...BM,...cdb(3,3),'puchun','win_confirm'),'third',7),
  // 赤失敗→復活_3→緑→昇格→青3プチュン
  scenario('S-040','虹復活→青プチュン★5','star5',
    seq('standby_rainbow','title',...RM,...cdr(3,1),'challenge_fail','revival_3',...GM,...cdg(3,3),PA,...BM,...cdb(3,3),'puchun','win_confirm'),'third',6),
  // 降格→復活→青3プチュン
  scenario('S-041','降格→青プチュン★5','star5',
    seq('standby_black','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,3),PB,...BM,...cdb(3,3),'demotion_full',...RM,...cdr(3,3),PA,...GM,...cdg(3,3),PB,...BM,...cdb(3,3),'puchun','win_confirm'),'third',5),

  // ══════════════════════════════════════════════════
  // ★6 (S-042〜S-047) 青2プチュン
  // ══════════════════════════════════════════════════
  scenario('S-042','青2プチュン★6','star6',
    seq('standby_white','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,3),PB,...BM,...cdb(3,2),'puchun','win_confirm'),'third',10),
  scenario('S-043','青2パトライト★6','star6',
    seq('standby_blue','title',...RM,...cdr(3,3),PB,...GM,...cdg(3,2),PA,...BM,...cdb(3,2),'puchun','win_confirm'),'third',9),
  // 各ステージ深め→青2プチュン
  scenario('S-044','全段深め→青2★6','star6',
    seq('standby_yellow','title',...RM,...cdr(3,2),PA,...GM,...cdg(3,2),PB,...BM,...cdb(3,2),'puchun','win_confirm'),'third',8),
  // 緑失敗→復活→青2プチュン
  scenario('S-045','緑失敗→復活→青2★6','star6',
    seq('standby_rainbow','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,3),'challenge_fail','revival_1',...BM,...cdb(3,2),'puchun','win_confirm'),'third',7),
  scenario('S-046','パトライト2連昇格→青2★6','star6',
    seq('standby_rainbow','title',...RM,...cdr(3,3),PB,...GM,...cdg(3,3),PB,...BM,...cdb(3,2),'puchun','win_confirm'),'third',7),
  // 降格→青2プチュン
  scenario('S-047','降格→青2プチュン★6','star6',
    seq('standby_black','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,3),'demotion_full',...RM,...cdr(3,3),PB,...GM,...cdg(3,3),PA,...BM,...cdb(3,2),'puchun','win_confirm'),'third',5),

  // ══════════════════════════════════════════════════
  // ★7 (S-048〜S-053) 虹3プチュン
  // ══════════════════════════════════════════════════
  scenario('S-048','虹即プチュン★7','star7',
    seq('standby_rainbow','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,3),PB,...BM,...cdb(3,3),PA,...RBM,...cdrw(3,3),'puchun','win_confirm'),'final',10),
  scenario('S-049','虹即パトライト★7','star7',
    seq('standby_rainbow','title',...RM,...cdr(3,3),PB,...GM,...cdg(3,3),PA,...BM,...cdb(3,3),PB,...RBM,...cdrw(3,3),'puchun','win_confirm'),'final',9),
  scenario('S-050','パトライト3連昇格→虹★7','star7',
    seq('standby_yellow','title',...RM,...cdr(3,3),PB,...GM,...cdg(3,3),PB,...BM,...cdb(3,3),PB,...RBM,...cdrw(3,3),'puchun','win_confirm'),'final',8),
  // 赤2失敗→復活→虹3プチュン
  scenario('S-051','復活→虹プチュン★7','star7',
    seq('standby_rainbow','title',...RM,...cdr(3,2),'challenge_fail','revival_1',...GM,...cdg(3,3),PB,...BM,...cdb(3,3),PA,...RBM,...cdrw(3,3),'puchun','win_confirm'),'final',7),
  // 降格→虹3プチュン
  scenario('S-052','降格最下層→虹★7','star7',
    seq('standby_black','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,3),PB,...BM,...cdb(3,3),'demotion_full',...RM,...cdr(3,3),PA,...GM,...cdg(3,3),PB,...BM,...cdb(3,3),PA,...RBM,...cdrw(3,3),'puchun','win_confirm'),'final',5),
  // challenge_fail(降格)→再挑戦→虹3プチュン
  scenario('S-053','降格→再挑戦→虹★7','star7',
    seq('standby_black','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,3),'challenge_fail',...RM,...cdr(3,3),PB,...GM,...cdg(3,3),PA,...BM,...cdb(3,3),PB,...RBM,...cdrw(3,3),'puchun','win_confirm'),'final',6),

  // ══════════════════════════════════════════════════
  // ★8 (S-054〜S-058) 虹2プチュン
  // ══════════════════════════════════════════════════
  scenario('S-054','虹2プチュン★8','star8',
    seq('standby_rainbow','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,3),PB,...BM,...cdb(3,3),PA,...RBM,...cdrw(3,2),'puchun','win_confirm'),'final',9),
  // 各ステージ深め→虹2
  scenario('S-055','全段深め→虹2★8','star8',
    seq('standby_rainbow','title',...RM,...cdr(3,2),PB,...GM,...cdg(3,2),PA,...BM,...cdb(3,2),PB,...RBM,...cdrw(3,2),'puchun','win_confirm'),'final',8),
  // 青失敗→復活_3→虹2プチュン
  scenario('S-056','青失敗→虹色復活→虹2★8','star8',
    seq('standby_rainbow','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,3),PB,...BM,...cdb(3,3),'challenge_fail','revival_3',...RBM,...cdrw(3,2),'puchun','win_confirm'),'final',6),
  // 降格→虹2
  scenario('S-057','降格×2→虹2★8','star8',
    seq('standby_black','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,3),PB,...BM,...cdb(3,3),'demotion_full',...RM,...cdr(3,3),PB,...GM,...cdg(3,3),PA,...BM,...cdb(3,3),PB,...RBM,...cdrw(3,2),'puchun','win_confirm'),'final',5),
  // 赤1失敗→パトライト復活→虹2プチュン
  scenario('S-058','パトライト復活→虹2★8','star8',
    seq('standby_rainbow','title',...RM,...cdr(3,1),'challenge_fail','patlite',...GM,...cdg(3,3),PA,...BM,...cdb(3,3),PB,...RBM,...cdrw(3,2),'puchun','win_confirm'),'final',6),

  // ══════════════════════════════════════════════════
  // ★9 (S-059〜S-063) 虹1プチュン
  // ══════════════════════════════════════════════════
  scenario('S-059','虹1プチュン★9','star9',
    seq('standby_rainbow','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,3),PB,...BM,...cdb(3,3),PA,...RBM,...cdrw(3,1),'puchun','win_confirm'),'final',8),
  scenario('S-060','3段全PA→虹1★9','star9',
    seq('standby_rainbow','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,3),PA,...BM,...cdb(3,3),PA,...RBM,...cdrw(3,1),'puchun','win_confirm'),'final',7),
  scenario('S-061','PBフル→虹1★9','star9',
    seq('standby_rainbow','title',...RM,...cdr(3,3),PB,...GM,...cdg(3,3),PA,...BM,...cdb(3,3),PB,...RBM,...cdrw(3,1),'puchun','win_confirm'),'final',7),
  // 降格→虹1
  scenario('S-062','降格→虹1★9','star9',
    seq('standby_black','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,3),'demotion_full',...RM,...cdr(3,3),PB,...GM,...cdg(3,3),PA,...BM,...cdb(3,3),PB,...RBM,...cdrw(3,1),'puchun','win_confirm'),'final',5),
  // 青失敗→虹色復活→虹1プチュン
  scenario('S-063','虹色復活→虹1★9','star9',
    seq('standby_rainbow','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,3),PB,...BM,...cdb(3,3),'challenge_fail','revival_3',...RBM,...cdrw(3,1),'puchun','win_confirm'),'final',4),

  // ══════════════════════════════════════════════════
  // ★10 (S-064〜S-067)
  // ══════════════════════════════════════════════════
  // 奇跡の赤3即プチュン → ★10
  scenario('S-064','奇跡の赤即★10','star10',
    seq('standby_rainbow','title',...RM,...cdr(3,3),'puchun','win_confirm'),'first',12),
  scenario('S-065','虹フル→★10','star10',
    seq('standby_rainbow','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,3),PB,...BM,...cdb(3,3),PA,...RBM,...cdrw(3,1),'puchun','win_confirm'),'final',9),
  // 全段深め→★10
  scenario('S-066','全段深め→★10','star10',
    seq('standby_rainbow','title',...RM,...cdr(3,2),PB,...GM,...cdg(3,2),PB,...BM,...cdb(3,2),PB,...RBM,...cdrw(3,1),'puchun','win_confirm'),'final',8),
  // 青失敗→復活→虹1プチュン → ★10
  scenario('S-067','虹色復活→★10','star10',
    seq('standby_rainbow','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,3),PB,...BM,...cdb(3,3),'challenge_fail','revival_3',...RBM,...cdrw(3,1),'puchun','win_confirm'),'final',6),

  // ══════════════════════════════════════════════════
  // ★11 (S-068〜S-071)
  // ══════════════════════════════════════════════════
  scenario('S-068','奇跡の赤即★11','star11',
    seq('standby_rainbow','title',...RM,...cdr(3,3),'puchun','win_confirm'),'first',9),
  scenario('S-069','虹フルカウント★11','star11',
    seq('standby_rainbow','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,3),PB,...BM,...cdb(3,3),PA,...RBM,...cdrw(3,1),'puchun','win_confirm'),'final',8),
  // 降格→虹1プチュン → ★11
  scenario('S-070','地獄脱出→★11','star11',
    seq('standby_black','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,3),'demotion_full',...RM,...cdr(3,3),PB,...GM,...cdg(3,3),PA,...BM,...cdb(3,3),PB,...RBM,...cdrw(3,1),'puchun','win_confirm'),'final',5),
  // 2度復活: red失敗→revival_1→green、green失敗→revival_3→blue→rainbow → ★11
  scenario('S-071','2度復活→★11','star11',
    seq('standby_rainbow','title',...RM,...cdr(3,3),'challenge_fail','revival_1',...GM,...cdg(3,3),'challenge_fail','revival_3',...BM,...cdb(3,3),PA,...RBM,...cdrw(3,1),'puchun','win_confirm'),'final',5),

  // ══════════════════════════════════════════════════
  // ★12 (S-072〜S-075) 最高レア
  // ══════════════════════════════════════════════════
  scenario('S-072','最速奇跡★12','star12',
    seq('standby_rainbow','title',...RM,...cdr(3,3),'puchun','win_confirm'),'first',6),
  // 全段深めフル → ★12
  scenario('S-073','虹フル伝説★12','star12',
    seq('standby_rainbow','title',...RM,...cdr(3,2),PA,...GM,...cdg(3,2),PB,...BM,...cdb(3,2),PA,...RBM,...cdrw(3,1),'puchun','win_confirm'),'final',6),
  // 2回降格→最終復帰 → ★12
  scenario('S-074','地獄×3→★12','star12',
    seq('standby_black','title',...RM,...cdr(3,3),PA,...GM,...cdg(3,3),'demotion_full',...RM,...cdr(3,3),PB,...GM,...cdg(3,3),PA,...BM,...cdb(3,3),'demotion_full',...RM,...cdr(3,3),PB,...GM,...cdg(3,3),PA,...BM,...cdb(3,3),PB,...RBM,...cdrw(3,1),'puchun','win_confirm'),'final',4),
  // 3回虹色復活 → ★12
  scenario('S-075','虹色3連復活→★12','star12',
    seq('standby_rainbow','title',...RM,...cdr(3,3),'challenge_fail','revival_3',...GM,...cdg(3,3),'challenge_fail','revival_3',...BM,...cdb(3,3),'challenge_fail','revival_3',...RBM,...cdrw(3,1),'puchun','win_confirm'),'final',4),
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
