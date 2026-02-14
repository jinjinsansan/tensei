# 来世ガチャ — 統合設計仕様書（Claude Code 実装用）

> **技術スタック**: Next.js (App Router) + Vercel + Supabase + Cloudflare (動画配信)
> **既存サイト**: https://raisegacha.com/
> **目的**: この文書1つで、ガチャ演出エンジンの全ロジックを実装できる完全仕様書

---

## 0. システム全体像

### 演出フロー（完全版）

```
ユーザーが「ガチャを回す」ボタンを押す
  ↓
サーバーで抽選（Supabase / RTP設定に基づく）
  ↓
GachaResult を取得（isLoss, rarity, cardId, isDonden, etc.）
  ↓
━━━ 共通テンプレート（全キャラ共通）━━━

Phase 1: STANDBY（待機映像ループ）
  ↓ ユーザータップ
Phase 2: COUNTDOWN（炎の数字カウントダウン × 4ステップ）
  ↓ 最終ステップ完了 or SKIPボタン
Phase 3: PUCHUN / LOSS 分岐
  ├── isLoss === true  → プチュンなし → Phase LOSS（即ハズレカード「転生失敗」）→ END
  └── isLoss === false → puchun.mp4 再生（当たり確定）
        ↓
━━━ キャラ固有モジュール（健太 等）━━━

Phase 3.5: TITLE_VIDEO（タイトル動画 3秒 + ★オーバーレイ）← NEW
  ↓ 自動遷移
Phase 4-A: 転生前シーン（4パターンからランダム × 2コマ）
  ↓ ユーザータップ
Phase 4-B: 転生チャンスシーン（転生前パターンに対応 × 1コマ）
  ↓ 自動遷移
Phase 4-C: 転生先メインシーン（カード別 × 2〜5コマ）
  ├── isDonden === true → どんでん返し演出（2コマ追加）→ 実カードのメインシーンへ
  └── isDonden === false → そのままカード表示へ
  ↓
Phase 5: CARD_REVEAL（カード結果表示）
  ↓
END
```

### 重要な設計原則

1. **Phase 1〜3 は共通テンプレート** — 健太でも今後の新キャラでも同一コード・同一素材
2. **Phase 3.5〜5 はキャラ固有モジュール** — キャラごとに別ファイルで実装
3. **新キャラ追加時に共通テンプレートは一切変更しない**
4. **レア度はサーバーで確定済み** — クライアントは演出のプレゼンテーションのみ
5. **全ての「ヒント」は60%正解・40%裏切り** — STANDBY色、カウントダウン色、タイトル動画、★表示すべて

---

## 1. 型定義

```typescript
// =============================================
// レア度
// =============================================
export type Rarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR' | 'LR';

// =============================================
// 演出グレード（カウントダウンの色パターン）
// =============================================
export type Grade = 'E1' | 'E2' | 'E3' | 'E4' | 'E5';

// =============================================
// カウントダウン関連
// =============================================
export type CdColor = 'green' | 'blue' | 'red' | 'rainbow';

export interface CountdownStep {
  number: number;   // 1-8
  color: CdColor;
}

export interface CountdownPattern {
  id: string;
  name: string;
  steps: [CountdownStep, CountdownStep, CountdownStep, CountdownStep];
}

// =============================================
// STANDBY関連
// =============================================
export type StandbyColor = 'black' | 'white' | 'yellow' | 'red' | 'blue' | 'rainbow';

// =============================================
// ガチャ結果（APIから返る）
// =============================================
export interface GachaResult {
  isLoss: boolean;
  characterId: string;          // 'kenta', 'character_02', ...
  cardId: string;               // 'card01_convenience', ...
  rarity: Rarity;
  starRating: number;           // 1-12
  cardName: string;
  cardTitle: string;
  cardImagePath: string;
  lossCardImagePath?: string;
  isDonden: boolean;
  dondenFromCardId?: string;    // どんでん返し前の偽カードID
  dondenFromRarity?: Rarity;    // どんでん返し前の偽レア度
  isSequel: boolean;
}

// =============================================
// 演出フェーズ
// =============================================
export type GachaPhase =
  | 'STANDBY'
  | 'COUNTDOWN'
  | 'PUCHUN'
  | 'TITLE_VIDEO'    // ← NEW: タイトル動画
  | 'LOSS_REVEAL'
  | 'PRE_SCENE'      // Phase 4-A: 転生前シーン
  | 'CHANCE_SCENE'    // Phase 4-B: 転生チャンスシーン
  | 'MAIN_SCENE'      // Phase 4-C: 転生先メインシーン
  | 'DONDEN_SCENE'    // Phase 4-D: どんでん返し
  | 'CARD_REVEAL';

// =============================================
// タイトル動画関連 ← NEW
// =============================================
export interface TitleVideoSelection {
  videoCardId: string;   // どのカードのタイトル動画を表示するか
  starDisplay: number;   // ★の表示数（1〜5）
  isRealCard: boolean;   // 実際の転生先のタイトル動画か（60%ヒント用）
}

// =============================================
// キャラ固有モジュールのインターフェース
// =============================================
export interface CharacterModule {
  characterId: string;
  characterName: string;
  cards: CardDefinition[];
  preScenePatterns: PreScenePattern[];
  chanceScenes: ChanceScene[];
  dondenRoutes: DondenRoute[];
  getTitleVideoPath: (cardId: string) => string;        // ← NEW
  getPreSceneVideoPath: (patternId: string, step: number) => string;
  getChanceSceneVideoPath: (patternId: string) => string;
  getMainSceneVideoPath: (cardId: string, step: number) => string;
  getDondenVideoPath: (fromCardId: string, toCardId: string, step: number) => string;
  getCardImagePath: (cardId: string) => string;
  getCardDisplayInfo: (cardId: string) => CardDisplayInfo;
}

export interface CardDefinition {
  cardId: string;
  name: string;
  title: string;
  rarity: Rarity;
  starRating: number;
  mainSceneSteps: number;  // コマ数（2〜5）
}

export interface PreScenePattern {
  patternId: string;       // 'A', 'B', 'C', 'D'
  steps: number;           // コマ数（通常2）
}

export interface ChanceScene {
  patternId: string;       // 転生前パターンと対応
}

export interface DondenRoute {
  fromCardId: string;      // 偽カード（低レア）
  toCardId: string;        // 実カード（高レア）
  steps: number;           // コマ数（通常2）
}

export interface CardDisplayInfo {
  name: string;
  title: string;
  description: string;
  rarity: Rarity;
  starRating: number;
}
```

---

## 2. Phase 1: STANDBY（待機映像）

### 素材ファイル（Cloudflare）

```
/gacha/common/standby/blackstandby.mp4
/gacha/common/standby/whitestandby.mp4
/gacha/common/standby/yellowstandby.mp4
/gacha/common/standby/redstandby.mp4
/gacha/common/standby/bluestandby.mp4
/gacha/common/standby/rainbowstandby.mp4
```

### 選択ロジック（60%ヒント方式）

レア度に基づいてSTANDBY色を選択。高レア → 赤/虹が出やすいが、確定ではない。

```typescript
const STANDBY_PROBABILITIES: Record<Rarity, Record<StandbyColor, number>> = {
  N:   { black: 45, white: 25, yellow: 15, blue: 10, red: 4,  rainbow: 1  },
  R:   { black: 20, white: 30, yellow: 25, blue: 15, red: 8,  rainbow: 2  },
  SR:  { black: 10, white: 15, yellow: 30, blue: 25, red: 15, rainbow: 5  },
  SSR: { black: 5,  white: 10, yellow: 15, blue: 30, red: 30, rainbow: 10 },
  UR:  { black: 3,  white: 5,  yellow: 10, blue: 20, red: 40, rainbow: 22 },
  LR:  { black: 2,  white: 3,  yellow: 5,  blue: 10, red: 35, rainbow: 45 },
};
```

### 動作仕様

```
1. 「ガチャを回す」ボタン押下
2. APIにガチャリクエスト送信（バックグラウンド）
3. blackstandby.mp4 をデフォルトループ再生
4. GachaResult 受信後、レア度に基づいてSTANDBY色を選択
   - isLoss === true → N相当の確率で色選択
   - isLoss === false → rarity に基づいて色選択
   - isDonden === true → dondenFromRarity（偽レア度）で色選択
5. 選択色のSTANDBY映像に切り替え（クロスフェード 0.3秒）
6. 3秒後に「タップして始める」テキストをフェードイン
7. ユーザータップ → Phase 2（COUNTDOWN）へ
```

---

## 3. Phase 2: COUNTDOWN（カウントダウン）

### 素材ファイル（Cloudflare）

```
/gacha/common/countdown/cd_{color}_{number}.mp4
  color: green, blue, red, rainbow
  number: 1-8
  合計: 32ファイル
  各動画: 3秒、炎の数字、効果音のみ（音楽なし）
```

### 演出グレード選択確率

```typescript
const GRADE_PROBABILITIES: Record<Rarity, Record<Grade, number>> = {
  N:   { E1: 55, E2: 25, E3: 12, E4: 6,  E5: 2  },
  R:   { E1: 30, E2: 40, E3: 20, E4: 8,  E5: 2  },
  SR:  { E1: 15, E2: 25, E3: 35, E4: 20, E5: 5  },
  SSR: { E1: 8,  E2: 15, E3: 25, E4: 40, E5: 12 },
  UR:  { E1: 5,  E2: 10, E3: 15, E4: 45, E5: 25 },
  LR:  { E1: 3,  E2: 7,  E3: 10, E4: 35, E5: 45 },
};
```

### 全30パターン定義

**E1: 全緑（6パターン）**

| ID | 名前 | Step1 | Step2 | Step3 | Step4 |
|---|---|---|---|---|---|
| E1-1 | 低空 | 🟢4 | 🟢3 | 🟢2 | 🟢1 |
| E1-2 | 標準 | 🟢5 | 🟢4 | 🟢3 | 🟢2 |
| E1-3 | やや高め | 🟢6 | 🟢5 | 🟢4 | 🟢3 |
| E1-4 | 高数字緑 | 🟢7 | 🟢6 | 🟢5 | 🟢4 |
| E1-5 | 最高数字緑 | 🟢8 | 🟢7 | 🟢6 | 🟢5 |
| E1-6 | 飛び番 | 🟢6 | 🟢4 | 🟢2 | 🟢1 |

**E2: 緑→青（6パターン）**

| ID | 名前 | Step1 | Step2 | Step3 | Step4 |
|---|---|---|---|---|---|
| E2-1 | 最後だけ青 | 🟢5 | 🟢4 | 🟢3 | 🔵2 |
| E2-2 | 後半青 | 🟢4 | 🟢3 | 🔵2 | 🔵1 |
| E2-3 | 遅咲き | 🟢6 | 🟢5 | 🟢4 | 🔵3 |
| E2-4 | 早めの青 | 🟢7 | 🔵6 | 🔵5 | 🔵4 |
| E2-5 | 高数字遅咲き | 🟢8 | 🟢7 | 🟢6 | 🔵5 |
| E2-6 | 1点青 | 🟢5 | 🟢4 | 🔵3 | 🟢2 |

**E3: 全青（6パターン）**

| ID | 名前 | Step1 | Step2 | Step3 | Step4 |
|---|---|---|---|---|---|
| E3-1 | 標準青 | 🔵6 | 🔵5 | 🔵4 | 🔵3 |
| E3-2 | 低空青 | 🔵4 | 🔵3 | 🔵2 | 🔵1 |
| E3-3 | 高数字青 | 🔵8 | 🔵7 | 🔵6 | 🔵5 |
| E3-4 | やや高青 | 🔵7 | 🔵6 | 🔵5 | 🔵4 |
| E3-5 | フェイク青 | 🔵6 | 🔵5 | 🟢4 | 🔵3 |
| E3-6 | 飛び番青 | 🔵8 | 🔵6 | 🔵4 | 🔵2 |

**E4: 青→赤 / 全赤（6パターン）**

| ID | 名前 | Step1 | Step2 | Step3 | Step4 |
|---|---|---|---|---|---|
| E4-1 | 最後だけ赤 | 🔵7 | 🔵6 | 🔵5 | 🔴4 |
| E4-2 | 後半赤 | 🔵7 | 🔵6 | 🔴5 | 🔴4 |
| E4-3 | 全赤 | 🔴8 | 🔴7 | 🔴6 | 🔴5 |
| E4-4 | 低空全赤 | 🔴5 | 🔴4 | 🔴3 | 🔴2 |
| E4-5 | 2段昇格 | 🟢6 | 🔵5 | 🔵4 | 🔴3 |
| E4-6 | 3段昇格 | 🟢5 | 🔵4 | 🔴3 | 🔴2 |

**E5: 赤→虹（6パターン）**

| ID | 名前 | Step1 | Step2 | Step3 | Step4 |
|---|---|---|---|---|---|
| E5-1 | 赤からの虹 | 🔴8 | 🔴7 | 🔴6 | 🌈5 |
| E5-2 | 青赤虹 | 🔵8 | 🔵7 | 🔴6 | 🌈5 |
| E5-3 | 低数字赤虹 | 🔴5 | 🔴4 | 🔴3 | 🌈2 |
| E5-4 | 全段昇格虹 | 🟢6 | 🔵5 | 🔴4 | 🌈3 |
| E5-5 | 緑からの奇跡虹 | 🟢4 | 🟢3 | 🔴2 | 🌈1 |
| E5-6 | 全赤長虹 | 🔴7 | 🔴6 | 🔴5 | 🌈4 |

### 動作仕様

```
1. レア度からグレード選択 → パターン選択 → 4ステップ取得
   - isLoss === true → N相当で選択
   - isDonden === true → dondenFromRarity（偽レア度）で選択
   - それ以外 → 実レア度で選択

2. 各ステップの再生:
   Step 1: 動画再生（3秒）→ 「NEXT ▸」ボタン → ユーザータップ
   Step 2: 動画再生（3秒）→ 「NEXT ▸」ボタン → ユーザータップ
   Step 3: 動画再生（3秒）→ 「NEXT ▸」ボタン → ユーザータップ
   Step 4: 動画再生（3秒）→ 自動的にPhase 3へ遷移

3. SKIPボタン: 常に表示「SKIP ▸▸」→ 残りスキップして即Phase 3へ

4. 色昇格時の追加演出:
   🟢→🔵: 画面が青くフラッシュ（0.15秒）
   🟢→🔴 / 🔵→🔴: 赤フラッシュ（0.2秒）+ 端末振動
   🔴→🌈: 白フラッシュ（0.3秒）+ 虹色パーティクル + 端末振動
   色の一時降格（E2-6, E3-5）: ノイズ演出（画面ブレ 0.1秒）
```

---

## 4. Phase 3: PUCHUN / LOSS 分岐

### これがガチャの核心的分岐点

```
COUNTDOWN 完了
  ├── isLoss === true  → プチュンなし → LOSS_REVEAL（即ハズレカード）
  └── isLoss === false → puchun.mp4 再生 → TITLE_VIDEO へ
```

### ハズレルート（プチュンなし）

```
1. カウントダウン Step4 完了
2. プチュン映像なし
3. 画面が暗転（0.5秒フェードアウト→フェードイン）
4. ハズレカード「転生失敗」を表示
5. テキスト: 「転生失敗」「この来世は見つかりませんでした...」
6. ボタン: 「もう一度ガチャを回す」/「ホームに戻る」
※ キャラ固有シナリオは一切なし
```

### 当たりルート（プチュンあり）

```
1. カウントダウン Step4 完了
2. puchun.mp4 を全画面再生（ブラウン管TV風暗転演出）
3. プチュン = 当たり確定（ユーザー歓喜ポイント）
4. 再生完了後 → Phase 3.5（TITLE_VIDEO）へ自動遷移
5. スキップ不可、ユーザー操作受け付けない
```

### 素材ファイル

```
/gacha/common/puchun/puchun.mp4     ← ブラウン管TV風暗転
/gacha/common/loss_card.png          ← ハズレカード画像（要作成）
```

---

## 5. Phase 3.5: TITLE_VIDEO（タイトル動画）← NEW

### 設計思想

プチュン直後に表示される「転生先のシンボル映像」。
タイトル動画は**レア度のヒントではなく、「12種類のうちどの転生先に行くか」の示唆**。

### 表示タイミング

```
プチュン映像再生（当たり確定）
  ↓
タイトル動画再生（3秒）+ ★オーバーレイ
  ↓
転生前シーン（Phase 4-A）開始
```

### タイトル動画の選択ロジック（60%ヒント方式）

```typescript
/**
 * タイトル動画の選択
 * - 60%: 実際の転生先のタイトル動画を表示（正しいヒント）
 * - 40%: 別のカードのタイトル動画を表示（裏切り）
 */
function selectTitleVideo(
  realCardId: string,
  allCardIds: string[]
): TitleVideoSelection {
  const isReal = Math.random() < 0.6;

  if (isReal) {
    return {
      videoCardId: realCardId,
      starDisplay: selectTitleStars(true),
      isRealCard: true,
    };
  } else {
    // 実カード以外からランダムに選ぶ
    const otherCards = allCardIds.filter(id => id !== realCardId);
    const fakeCardId = otherCards[Math.floor(Math.random() * otherCards.length)];
    return {
      videoCardId: fakeCardId,
      starDisplay: selectTitleStars(false),
      isRealCard: false,
    };
  }
}

/**
 * ★表示の選択（1〜5）
 * ★は「この転生先になれるかどうか」の期待度
 * - isRealCard === true（実際にこの転生先になる場合）→ ★多めが出やすい
 * - isRealCard === false（実際にはならない場合）→ ★少なめが出やすい
 * ただし、これも60%ヒント方式
 */
function selectTitleStars(isRealCard: boolean): number {
  if (isRealCard) {
    // 60%: ★4-5（期待させる）, 40%: ★1-3（裏切り準備）
    const weights = [5, 10, 15, 35, 35]; // ★1,2,3,4,5
    return weightedRandom(weights) + 1;
  } else {
    // 60%: ★1-2（期待させない）, 40%: ★3-5（嬉しい裏切り準備）
    const weights = [30, 30, 20, 15, 5]; // ★1,2,3,4,5
    return weightedRandom(weights) + 1;
  }
}
```

### ★オーバーレイの表示仕様

```
- ★の数: 1〜5
- 表示位置: 画面下部中央（動画の上にオーバーレイ）
- ★のスタイル: 金色の星アイコン（点灯 = 金色、消灯 = グレー）
- アニメーション: ★が1つずつ点灯していく（0.3秒間隔）
- 例: ★★★☆☆ → 最初から3つが金色、残り2つがグレー
- ★は動画に焼き込まない（プログラムでオーバーレイ描画）
```

### ユーザー心理の設計例

```
ボクシンググローブの動画 + ★★★★☆
→ 「ボクサー！？カッコいい！★4つ...期待できるかも！」
→ 60%: 本当にボクサーに転生する
→ 40%: 実は別の転生先になる

聖剣の動画 + ★★☆☆☆
→ 「勇者！？でも★2つ...ダメかも...」
→ 60%: 本当に勇者にはならない
→ 40%: 実は勇者になる（嬉しい裏切り）
```

### 動作仕様

```
1. プチュン完了後、自動遷移
2. selectTitleVideo() でタイトル動画とスター数を決定
3. タイトル動画（3秒）をフルスクリーン再生
4. 動画の上に★オーバーレイを表示（★が1つずつ点灯アニメーション）
5. 再生完了後 → Phase 4-A（転生前シーン）へ自動遷移
6. スキップ不可
```

### 素材ファイル（健太・Cloudflare）

```
/gacha/characters/kenta/title/kenta_title_c01.mp4  ← ★1 コンビニ（幽霊レジ + 闇のコンビニ）
/gacha/characters/kenta/title/kenta_title_c02.mp4  ← ★2 倉庫（ヘルメット + 段ボールの壁）
/gacha/characters/kenta/title/kenta_title_c03.mp4  ← ★3 YouTuber（PC画面 + 光のオーラ）
/gacha/characters/kenta/title/kenta_title_c04.mp4  ← ★4 公務員（デスクランプ + 書類の山）
/gacha/characters/kenta/title/kenta_title_c05.mp4  ← ★5 ラーメン屋（丼 + 黄金の湯気）
/gacha/characters/kenta/title/kenta_title_c06.mp4  ← ★6 ボクサー（ボクシンググローブ）
/gacha/characters/kenta/title/kenta_title_c07.mp4  ← ★7 外科医（メス + 心電図）
/gacha/characters/kenta/title/kenta_title_c08.mp4  ← ★8 実業家（高層ビル夜景）
/gacha/characters/kenta/title/kenta_title_c09.mp4  ← ★9 傭兵（大剣 + 赤マント）
/gacha/characters/kenta/title/kenta_title_c10.mp4  ← ★10 ロックスター（エレキギター + 紫光）
/gacha/characters/kenta/title/kenta_title_c11.mp4  ← ★11 魔王（禍々しい玉座 + 紫赤稲妻）
/gacha/characters/kenta/title/kenta_title_c12.mp4  ← ★12 勇者（金色聖剣 + 白い羽根）
全て3秒、セリフなし、テキストなし、映像演出のみ
```

---

## 6. Phase 4: キャラ固有シナリオ（健太モジュール）

### 6-A: 転生前シーン（全カード共通・ランダム4パターン）

```
パターンA: 深夜のコンビニ（2コマ: kenta_pre_a1, kenta_pre_a2）
パターンB: 雨の帰り道（2コマ: kenta_pre_b1, kenta_pre_b2）
パターンC: シフト減（2コマ: kenta_pre_c1, kenta_pre_c2）
パターンD: 同級生格差（2コマ: kenta_pre_d1, kenta_pre_d2）
```

どのカードでも転生前シーンは同じ → レア度のネタバレ防止

### 6-B: 転生チャンスシーン（転生前パターンに対応）

```
パターンA → kenta_chance_a.mp4（金色の自動ドア）
パターンB → kenta_chance_b.mp4（水たまり魔法陣）
パターンC → kenta_chance_c.mp4（夜空の光球体）
パターンD → kenta_chance_d.mp4（鏡の向こう異次元）
```

スキップ不可（演出の頂点）

### 6-C: 転生先メインシーン（カード別）

| ★ | レア度 | カードID | カード名 | コマ数 |
|---|---|---|---|---|
| 1 | N | card01_convenience | コンビニ夜勤バイト | 2コマ |
| 2 | N | card02_warehouse | 派遣倉庫作業員 | 2コマ |
| 3 | R | card03_youtuber | 底辺YouTuber | 3コマ |
| 4 | R | card04_civil_servant | 地方公務員 | 3コマ |
| 5 | SR | card05_ramen | ラーメン屋店主 | 3コマ |
| 6 | SR | card06_boxer | プロボクサー | 3コマ |
| 7 | SSR | card07_surgeon | 天才外科医 | 4コマ |
| 8 | SSR | card08_business_owner | 実業家 | 4コマ |
| 9 | UR | card09_mercenary | 異世界傭兵 | 4コマ |
| 10 | UR | card10_rockstar | 伝説のロックスター | 4コマ |
| 11 | LR | card11_demon_king | 魔王 | 5コマ |
| 12 | LR | card12_hero | 勇者 | 5コマ |

動画ファイル名: `kenta_c{XX}_{step}.mp4`（例: kenta_c07_3.mp4 = 外科医コマ3）
各コマ: 5秒動画、日本語セリフあり

### 6-D: どんでん返し（上方逆転）

| 偽カード（先に見せる） | → | 実カード（逆転後） |
|---|---|---|
| ★1 コンビニ | → | ★5 ラーメン屋 |
| ★1 コンビニ | → | ★7 外科医 |
| ★2 倉庫 | → | ★6 ボクサー |
| ★2 倉庫 | → | ★8 実業家 |
| ★3 YouTuber | → | ★10 ロックスター |
| ★4 公務員 | → | ★9 傭兵 |
| ★5 ラーメン屋 | → | ★8 実業家 |
| ★6 ボクサー | → | ★9 傭兵 |
| ★7 外科医 | → | ★11 魔王 |
| ★8 実業家 | → | ★12 勇者 |

動画ファイル名: `kenta_rev_c{from}_c{to}_{step}.mp4`
各ルート2コマ: コマ1 = 偽カード画像で変身前、コマ2 = 実カード画像で変身後

### どんでん返し時のフロー

```
偽カードのメインシーン再生（低レア演出）
  ↓ ユーザー「ハズレかよ...」
画面グリッチ + 「運命の逆転」テロップ
  ↓
どんでん返しコマ1（偽カード側の驚き演出）
  ↓
どんでん返しコマ2（実カード側の世界に到着）
  ↓
実カードのメインシーン再生（高レア演出）
  ↓
CARD_REVEAL（実カード表示）
```

---

## 7. Phase 5: CARD_REVEAL（カード結果表示）

### 通常カード表示

```
1. 暗転 → 金色の光がカード型に集まる
2. カード画像が回転しながら中央に登場
3. ★の数に応じた演出:
   ★1〜2: シンプルなフェードイン
   ★3〜4: 青い光のパーティクル
   ★5〜6: 赤い炎のパーティクル
   ★7〜8: 金色の電撃エフェクト
   ★9〜10: 虹色のオーラ + 画面振動
   ★11〜12: 全画面光 + 天使の羽根 + 大振動
4. カード名、★数、レア度バッジを表示
5. 「NEW」バッジ表示（初獲得時）

ボタン:
  - 「コレクションに追加」（プライマリ）
  - 「もう一度ガチャを回す」（セカンダリ）
  - 「シェアする」（SNSシェア）
```

### どんでん返し時のカード表示

```
1. 偽カードが一瞬表示（0.3秒）
2. カードにヒビが入るエフェクト
3. カードが砕けて散る
4. 中から実カード（高レア度）が光とともに出現
5. 通常の★演出（より豪華に）
```

---

## 8. RTP設定 & 管理パネル

### Supabase テーブル設計

```sql
-- RTP設定テーブル
CREATE TABLE gacha_rtp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id TEXT NOT NULL DEFAULT 'kenta',
  loss_rate NUMERIC NOT NULL DEFAULT 60,           -- ハズレ率（0-100%）
  rarity_n NUMERIC NOT NULL DEFAULT 35,            -- 当たり内 N 分布
  rarity_r NUMERIC NOT NULL DEFAULT 25,
  rarity_sr NUMERIC NOT NULL DEFAULT 20,
  rarity_ssr NUMERIC NOT NULL DEFAULT 12,
  rarity_ur NUMERIC NOT NULL DEFAULT 6,
  rarity_lr NUMERIC NOT NULL DEFAULT 2,
  donden_rate NUMERIC NOT NULL DEFAULT 15,         -- どんでん返し発動率（当たり内）
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 演出確率テーブル（STANDBY色 / カウントダウングレード）
CREATE TABLE gacha_presentation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_type TEXT NOT NULL,  -- 'standby_color' or 'countdown_grade' or 'title_hint'
  rarity TEXT NOT NULL,
  probabilities JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 管理パネル機能一覧

```
■ RTP設定
  - ハズレ率スライダー（0-100%）
  - 当たり時レア度分布（N/R/SR/SSR/UR/LR、合計100%バリデーション）
  - どんでん返し発動率スライダー

■ 演出確率設定
  - STANDBY色の確率テーブル（レア度ごとに6色の%を設定）
  - カウントダウングレードの確率テーブル（レア度ごとに5グレードの%を設定）
  - タイトル動画の60%ヒント確率調整

■ カウントダウンパターン管理
  - 既存30パターンの編集
  - 新パターンの追加（グレード指定 + 4ステップの色×数字を設定）
  - パターンの有効/無効切替

■ シナリオ管理
  - キャラ一覧表示
  - 各キャラのカード一覧
  - カード情報の編集（名前、説明、レア度、コマ数）
  - どんでん返しルートの追加・編集
  - 動画パスの確認・更新

■ 管理パネルUI（パス: /admin）
  - Supabase Auth でログイン保護
  - 変更は即時反映（Supabase realtime）
  - 変更履歴ログ
```

---

## 9. 抽選ロジック（サーバーサイド / Supabase Edge Function）

```typescript
interface RTPConfig {
  lossRate: number;
  rarityDistribution: Record<Rarity, number>;
  dondenRate: number;
}

async function drawGacha(characterId: string): Promise<GachaResult> {
  // 1. Supabase から RTP設定を取得
  const config = await getRTPConfig(characterId);

  // 2. ハズレ / 当たり判定
  const isLoss = Math.random() * 100 < config.lossRate;

  if (isLoss) {
    return {
      isLoss: true,
      characterId,
      cardId: 'loss',
      rarity: 'N',
      starRating: 0,
      cardName: '転生失敗',
      cardTitle: 'この来世は見つかりませんでした...',
      cardImagePath: '',
      lossCardImagePath: '/gacha/common/loss_card.png',
      isDonden: false,
      isSequel: false,
    };
  }

  // 3. レア度抽選
  const rarity = drawRarity(config.rarityDistribution);

  // 4. レア度に基づいてカードを選択（同レア度内で均等確率）
  const card = selectCardByRarity(characterId, rarity);

  // 5. どんでん返し判定
  const isDonden = Math.random() * 100 < config.dondenRate;
  let dondenFromCardId: string | undefined;
  let dondenFromRarity: Rarity | undefined;

  if (isDonden) {
    // どんでん返しルートが存在するか確認
    const dondenRoute = findDondenRoute(characterId, card.cardId);
    if (dondenRoute) {
      dondenFromCardId = dondenRoute.fromCardId;
      dondenFromRarity = getCardRarity(characterId, dondenRoute.fromCardId);
    }
  }

  return {
    isLoss: false,
    characterId,
    cardId: card.cardId,
    rarity,
    starRating: card.starRating,
    cardName: card.name,
    cardTitle: card.title,
    cardImagePath: card.imagePath,
    isDonden: !!dondenFromCardId,
    dondenFromCardId,
    dondenFromRarity,
    isSequel: false,
  };
}
```

---

## 10. ディレクトリ構成

```
src/
  app/
    page.tsx                         ← メインページ
    admin/
      page.tsx                       ← 管理パネル
      rtp/page.tsx                   ← RTP設定
      presentations/page.tsx         ← 演出確率設定
      countdown-patterns/page.tsx    ← カウントダウンパターン管理
      scenarios/page.tsx             ← シナリオ管理
    api/
      gacha/
        draw/route.ts                ← 抽選API（Edge Function）
        rtp/route.ts                 ← RTP設定API
  lib/
    gacha/
      common/
        gacha-engine.ts              ← 共通演出エンジン（Phase 1-3）
        standby-selector.ts          ← STANDBY映像選択ロジック
        countdown-selector.ts        ← カウントダウンパターン選択ロジック
        title-video-selector.ts      ← タイトル動画選択ロジック ← NEW
        types.ts                     ← 共通型定義
      characters/
        kenta/
          kenta-module.ts            ← 健太固有モジュール
          kenta-cards.ts             ← カード定義12枚
          kenta-donden.ts            ← どんでん返しルート10種
        character-registry.ts        ← キャラ登録・切替
    supabase/
      client.ts                      ← Supabase クライアント
      rtp.ts                         ← RTP設定 CRUD
  components/
    gacha/
      GachaPlayer.tsx                ← メインプレイヤーUI
      phases/
        StandbyPhase.tsx
        CountdownPhase.tsx
        PuchunPhase.tsx
        TitleVideoPhase.tsx          ← NEW
        LossRevealPhase.tsx
        PreScenePhase.tsx
        ChanceScenePhase.tsx
        MainScenePhase.tsx
        DondenScenePhase.tsx
        CardRevealPhase.tsx
      overlays/
        StarOverlay.tsx              ← ★オーバーレイ ← NEW
        ColorFlashOverlay.tsx        ← 色昇格フラッシュ
        SkipButton.tsx
        NextButton.tsx
    admin/
      RTPEditor.tsx
      PresentationEditor.tsx
      CountdownPatternEditor.tsx
      ScenarioEditor.tsx

Cloudflare (動画・画像配信):
  /gacha/common/standby/             ← STANDBY動画 6本
  /gacha/common/countdown/           ← カウントダウン動画 32本
  /gacha/common/puchun/              ← プチュン動画 1本
  /gacha/common/loss_card.png        ← ハズレカード画像
  /gacha/characters/kenta/title/     ← タイトル動画 12本 ← NEW
  /gacha/characters/kenta/pre/       ← 転生前シーン 8本
  /gacha/characters/kenta/chance/    ← 転生チャンスシーン 4本
  /gacha/characters/kenta/main/      ← 転生先メインシーン 41本
  /gacha/characters/kenta/donden/    ← どんでん返し 20本
  /gacha/characters/kenta/cards/     ← カード画像 12枚
```

---

## 11. 全動画素材一覧

| カテゴリ | 本数 | ファイル名パターン | 状態 |
|---|---|---|---|
| 共通: STANDBY | 6本 | {color}standby.mp4 | ✅完成 |
| 共通: カウントダウン | 32本 | cd_{color}_{number}.mp4 | ✅完成 |
| 共通: プチュン | 1本 | puchun.mp4 | ✅完成 |
| 健太: タイトル動画 | 12本 | kenta_title_c{XX}.mp4 | ✅完成 |
| 健太: 転生前シーン | 8本 | kenta_pre_{pattern}{step}.mp4 | ✅完成 |
| 健太: 転生チャンスシーン | 4本 | kenta_chance_{pattern}.mp4 | ✅完成 |
| 健太: 転生先メインシーン | 41本 | kenta_c{XX}_{step}.mp4 | ✅完成 |
| 健太: どんでん返し | 20本 | kenta_rev_c{from}_c{to}_{step}.mp4 | ✅完成 |
| **合計** | **124本** | | |

---

## 12. メインプレイヤー実装（GachaPlayer.tsx 概要）

```typescript
export function GachaPlayer({ gachaResult }: { gachaResult: GachaResult }) {
  const [phase, setPhase] = useState<GachaPhase>('STANDBY');
  const [preScenePattern, setPreScenePattern] = useState<string>('');

  // 共通テンプレートの演出選択
  const standbyColor = useMemo(() => {
    if (gachaResult.isLoss) return selectStandby('N');
    if (gachaResult.isDonden) return selectStandby(gachaResult.dondenFromRarity!);
    return selectStandby(gachaResult.rarity);
  }, [gachaResult]);

  const countdownResult = useMemo(() => {
    if (gachaResult.isLoss) return selectCountdown('N');
    if (gachaResult.isDonden) return selectCountdown(gachaResult.dondenFromRarity!);
    return selectCountdown(gachaResult.rarity);
  }, [gachaResult]);

  // タイトル動画選択（当たり時のみ）
  const titleVideoSelection = useMemo(() => {
    if (gachaResult.isLoss) return null;
    const character = getCharacter(gachaResult.characterId);
    const allCardIds = character.cards.map(c => c.cardId);
    const realCardId = gachaResult.isDonden
      ? gachaResult.dondenFromCardId!  // どんでん返し時は偽カードのタイトル動画
      : gachaResult.cardId;
    return selectTitleVideo(realCardId, allCardIds);
  }, [gachaResult]);

  // 転生前パターンをランダム選択
  useEffect(() => {
    const patterns = ['A', 'B', 'C', 'D'];
    setPreScenePattern(patterns[Math.floor(Math.random() * patterns.length)]);
  }, []);

  const character = gachaResult.isLoss
    ? null
    : getCharacter(gachaResult.characterId);

  // Phase遷移ハンドラ
  const handleCountdownComplete = () => {
    if (gachaResult.isLoss) {
      setPhase('LOSS_REVEAL');
    } else {
      setPhase('PUCHUN');
    }
  };

  return (
    <FullScreenPortal>
      {phase === 'STANDBY' && (
        <StandbyPhase
          videoPath={getStandbyVideoPath(standbyColor)}
          onTap={() => setPhase('COUNTDOWN')}
        />
      )}

      {phase === 'COUNTDOWN' && (
        <CountdownPhase
          pattern={countdownResult.pattern}
          onComplete={handleCountdownComplete}
          onSkip={handleCountdownComplete}
        />
      )}

      {phase === 'PUCHUN' && (
        <PuchunPhase
          videoPath="/gacha/common/puchun/puchun.mp4"
          onComplete={() => setPhase('TITLE_VIDEO')}
        />
      )}

      {phase === 'TITLE_VIDEO' && titleVideoSelection && character && (
        <TitleVideoPhase
          videoPath={character.getTitleVideoPath(titleVideoSelection.videoCardId)}
          starCount={titleVideoSelection.starDisplay}
          onComplete={() => setPhase('PRE_SCENE')}
        />
      )}

      {phase === 'PRE_SCENE' && character && (
        <PreScenePhase
          character={character}
          patternId={preScenePattern}
          onComplete={() => setPhase('CHANCE_SCENE')}
        />
      )}

      {phase === 'CHANCE_SCENE' && character && (
        <ChanceScenePhase
          character={character}
          patternId={preScenePattern}
          onComplete={() => setPhase('MAIN_SCENE')}
        />
      )}

      {phase === 'MAIN_SCENE' && character && (
        <MainScenePhase
          character={character}
          gachaResult={gachaResult}
          onComplete={() => {
            if (gachaResult.isDonden) {
              setPhase('DONDEN_SCENE');
            } else {
              setPhase('CARD_REVEAL');
            }
          }}
        />
      )}

      {phase === 'DONDEN_SCENE' && character && (
        <DondenScenePhase
          character={character}
          gachaResult={gachaResult}
          onComplete={() => setPhase('CARD_REVEAL')}
        />
      )}

      {phase === 'CARD_REVEAL' && character && (
        <CardRevealPhase
          character={character}
          gachaResult={gachaResult}
        />
      )}

      {phase === 'LOSS_REVEAL' && (
        <LossRevealPhase gachaResult={gachaResult} />
      )}
    </FullScreenPortal>
  );
}
```

---

## 13. 動画プリロード戦略（一括プリロード方式）

### 設計思想

「ガチャを回す」ボタン押下時点で、カード表示までの全シナリオはシステム側で
既に確定している。そのため**全動画URLを一括で取得し、STANDBY再生中にまとめて
プリロードを開始**する。これにより、ユーザーがNEXTボタンを押した瞬間に
次の動画がストレスなく即再生される。

※ 尊師プロジェクトで「逐次プリロード」方式ではNEXTボタン後のタイムラグが
  体感として遅かったため、一括方式に変更。

### プリロードフロー

```
「ガチャを回す」ボタン押下
  ↓
APIリクエスト → GachaResult 取得
  ↓
全演出パラメータをクライアントで確定:
  - STANDBY色
  - カウントダウンパターン（4ステップ分の動画URL）
  - プチュン動画URL（当たり時のみ）
  - タイトル動画URL（当たり時のみ）
  - 転生前シーン動画URL（2本）
  - 転生チャンスシーン動画URL（1本）
  - 転生先メインシーン動画URL（2〜5本）
  - どんでん返し動画URL（発動時のみ、2本）
  - カード画像URL
  ↓
全URLリストを生成（buildPreloadList関数）
  ↓
STANDBY映像をループ再生しながら、バックグラウンドで全動画を一括プリロード
  ↓
ユーザータップ → 以降は全てキャッシュ済みの動画を即再生
```

### 実装

```typescript
/**
 * ガチャ開始時に再生する全動画のURLリストを生成
 * GachaResult 確定後、STANDBY再生開始と同時に呼び出す
 */
function buildPreloadList(
  gachaResult: GachaResult,
  countdownPattern: CountdownPattern,
  titleVideoSelection: TitleVideoSelection | null,
  preScenePattern: string,
  character: CharacterModule | null,
): string[] {
  const urls: string[] = [];

  // 1. カウントダウン動画（4本）
  for (const step of countdownPattern.steps) {
    urls.push(getCountdownVideoPath(step));
  }

  if (gachaResult.isLoss) {
    // ハズレルート: カウントダウンのみ（プチュン以降なし）
    return urls;
  }

  // 2. プチュン動画
  urls.push('/gacha/common/puchun/puchun.mp4');

  if (!character || !titleVideoSelection) return urls;

  // 3. タイトル動画
  urls.push(character.getTitleVideoPath(titleVideoSelection.videoCardId));

  // 4. 転生前シーン（2本）
  urls.push(character.getPreSceneVideoPath(preScenePattern, 1));
  urls.push(character.getPreSceneVideoPath(preScenePattern, 2));

  // 5. 転生チャンスシーン（1本）
  urls.push(character.getChanceSceneVideoPath(preScenePattern));

  // 6. 転生先メインシーン（2〜5本）
  const playCardId = gachaResult.isDonden
    ? gachaResult.dondenFromCardId!  // どんでん返し時は偽カードを先に再生
    : gachaResult.cardId;
  const mainSteps = character.cards.find(c => c.cardId === playCardId)?.mainSceneSteps ?? 2;
  for (let i = 1; i <= mainSteps; i++) {
    urls.push(character.getMainSceneVideoPath(playCardId, i));
  }

  // 7. どんでん返し動画（発動時のみ、2本 + 実カードのメインシーン）
  if (gachaResult.isDonden && gachaResult.dondenFromCardId) {
    urls.push(character.getDondenVideoPath(
      gachaResult.dondenFromCardId, gachaResult.cardId, 1));
    urls.push(character.getDondenVideoPath(
      gachaResult.dondenFromCardId, gachaResult.cardId, 2));

    // 実カードのメインシーンも追加
    const realSteps = character.cards.find(c => c.cardId === gachaResult.cardId)?.mainSceneSteps ?? 2;
    for (let i = 1; i <= realSteps; i++) {
      urls.push(character.getMainSceneVideoPath(gachaResult.cardId, i));
    }
  }

  // 8. カード画像
  urls.push(character.getCardImagePath(gachaResult.cardId));

  return urls;
}

/**
 * 全動画を一括プリロード
 * <video preload="auto"> の非表示要素を動的生成、
 * または fetch() で blob を取得してキャッシュ
 */
async function preloadAllVideos(urls: string[]): Promise<void> {
  const promises = urls.map(url => {
    return new Promise<void>((resolve) => {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.src = url;
      video.oncanplaythrough = () => resolve();
      video.onerror = () => resolve(); // エラーでも止めない
      // タイムアウト: 10秒で諦める（低速回線対策）
      setTimeout(() => resolve(), 10000);
    });
  });
  await Promise.allSettled(promises);
}
```

### ローディング表示

```
STANDBY映像ループ再生中に、プリロード進捗をUIに表示:
  - 画面下部にプログレスバー（控えめ）
  - 全プリロード完了前にユーザーがタップした場合:
    → カウントダウンは開始する（Step1は最優先でプリロードされているため）
    → 残りのプリロードはバックグラウンドで継続
  - プリロードが間に合わなかった動画がある場合:
    → 再生開始時にローディングスピナーを表示（最大3秒）
    → 3秒経過してもロードできない場合はスキップして次へ
```

---

## 14. 新キャラ追加手順（Claude Code向け）

```
1. src/lib/gacha/characters/{新キャラID}/ フォルダ作成
2. カード定義ファイル作成（{新キャラ}-cards.ts）
3. どんでん返しルート定義（{新キャラ}-donden.ts）
4. モジュール実装（{新キャラ}-module.ts）— CharacterModule インターフェース準拠
5. character-registry.ts に registerCharacter() で登録
6. Cloudflare に動画・画像素材をアップロード

※ Phase 1〜3（STANDBY・COUNTDOWN・PUCHUN）のコードは一切変更しない
※ 共通テンプレートのコードには触れない
※ 管理パネルに新キャラのRTP設定を追加
```

---

## 15. 実装ルール（Claude Codeへの指示）

1. **Phase 1〜3 のコードにキャラ固有情報を含めない**
2. **演出選択はクライアントサイド** — サーバーは `GachaResult` のみ返す
3. **ハズレ/当たり判定はサーバーサイド** — `isLoss` フラグを信頼して分岐
4. **プチュンの有無 = 当たり/ハズレの唯一の分岐点** — 曖昧にしない
5. **動画一括プリロードを必ず実装** — ガチャ開始時に全動画URLを一括取得し、STANDBY中にまとめてプリロード。NEXTボタン押下時のタイムラグをゼロにする
6. **Cloudflare CDN からの動画配信** — `/gacha/` パス以下
7. **管理パネルの変更は即時反映** — Supabase realtime or revalidate
8. **全確率テーブルは管理パネルから変更可能** — ハードコード禁止
9. **TypeScript strict mode** — 型安全性を確保
10. **モバイルファースト** — 9:16 縦動画前提のUI設計
