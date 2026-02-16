# 来世ガチャ — 統合設計仕様書 v2（Claude Code 実装用）

> **技術スタック**: Next.js (App Router) + Vercel + Supabase + Cloudflare (動画配信)
> **既存サイト**: https://raisegacha.com/
> **v1からの主な変更点**: マルチキャラクター対応（健太＋昭一）、キャラクター出現率設定、キャラ別RTP
> **目的**: この文書1つで、マルチキャラ対応ガチャ演出エンジンの全ロジックを実装できる完全仕様書

---

## 0. システム全体像

### 演出フロー（v2: マルチキャラ対応）

```
ユーザーが「ガチャを回す」ボタンを押す
  ↓
サーバーで抽選:
  1. ハズレ / 当たり判定（共通ロス率）
  2. 当たりの場合 → キャラクター抽選（健太 or 昭一 or 将来キャラ）
  3. 選ばれたキャラの★レベル抽選（キャラ別RTP）
  4. ★レベルに一致するカードから1枚抽選
  5. どんでん返し判定
  ↓
GachaResult を取得
  ↓
━━━ 共通テンプレート（全キャラ共通・キャラ非依存）━━━

Phase 1: STANDBY（待機映像ループ）
  ↓ ユーザータップ
Phase 2: COUNTDOWN（炎の数字カウントダウン × 4ステップ）
  ↓ 最終ステップ完了 or SKIPボタン
Phase 3: PUCHUN / LOSS 分岐
  ├── isLoss === true  → プチュンなし → Phase LOSS（共通ハズレカード）→ END
  └── isLoss === false → puchun.mp4 再生（当たり確定）
        ↓
━━━ キャラ固有モジュール（健太 or 昭一）━━━
※ ここで初めてキャラが画面に現れる

Phase 3.5: TITLE_VIDEO（タイトル動画 3秒 + ★オーバーレイ）
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

1. **Phase 1〜3 は共通テンプレート** — 健太でも昭一でも同一コード・同一素材。キャラ情報は一切参照しない
2. **Phase 3.5〜5 はキャラ固有モジュール** — キャラごとに別ファイルで実装、CharacterModuleインターフェース準拠
3. **新キャラ追加時に共通テンプレートは一切変更しない**
4. **キャラクター選択はサーバーサイドで完結** — クライアントはcharacterIdに基づいてモジュールをロードするだけ
5. **全ての「ヒント」は60%正解・40%裏切り** — STANDBY色、カウントダウン色、タイトル動画、★表示すべて
6. **LOSSの場合もキャラ抽選は行わない** — LOSS時はキャラ非依存の共通ハズレカードを表示

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
// キャラクターID（v2: マルチキャラ対応）
// =============================================
export type CharacterId = 'kenta' | 'shoichi';
// 将来: | 'character_03' | 'character_04' ...

// =============================================
// ガチャ結果（APIから返る）— v2更新
// =============================================
export interface GachaResult {
  isLoss: boolean;
  characterId: CharacterId;       // ← v2: 抽選されたキャラID
  cardId: string;
  rarity: Rarity;
  starRating: number;             // 1-12
  cardName: string;
  cardTitle: string;
  cardImagePath: string;
  lossCardImagePath?: string;     // LOSS時のみ（共通ハズレカード）
  isDonden: boolean;
  dondenFromCardId?: string;
  dondenFromRarity?: Rarity;
  isSequel: boolean;
}

// =============================================
// 演出フェーズ
// =============================================
export type GachaPhase =
  | 'STANDBY'
  | 'COUNTDOWN'
  | 'PUCHUN'
  | 'TITLE_VIDEO'
  | 'LOSS_REVEAL'
  | 'PRE_SCENE'
  | 'CHANCE_SCENE'
  | 'MAIN_SCENE'
  | 'DONDEN_SCENE'
  | 'CARD_REVEAL';

// =============================================
// タイトル動画関連
// =============================================
export interface TitleVideoSelection {
  videoCardId: string;
  starDisplay: number;
  isRealCard: boolean;
}

// =============================================
// キャラ固有モジュールのインターフェース（v1と同一）
// =============================================
export interface CharacterModule {
  characterId: CharacterId;
  characterName: string;
  cards: CardDefinition[];
  preScenePatterns: PreScenePattern[];
  chanceScenes: ChanceScene[];
  dondenRoutes: DondenRoute[];
  getTitleVideoPath: (cardId: string) => string;
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
  mainSceneSteps: number;
}

export interface PreScenePattern {
  patternId: string;
  steps: number;
}

export interface ChanceScene {
  patternId: string;
}

export interface DondenRoute {
  fromCardId: string;
  toCardId: string;
  steps: number;
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

## 2. Phase 1: STANDBY（待機映像）— 変更なし

### 素材ファイル（Cloudflare）

```
/gacha/common/standby/blackstandby.mp4
/gacha/common/standby/whitestandby.mp4
/gacha/common/standby/yellowstandby.mp4
/gacha/common/standby/redstandby.mp4
/gacha/common/standby/bluestandby.mp4
/gacha/common/standby/rainbowstandby.mp4
```

### 選択ロジック

STANDBY色はレア度に応じた確率テーブルで選択。この段階ではキャラ情報は一切使用しない。

```
レア度に対するSTANDBY色の確率（管理パネルで調整可能）:

       | black | white | yellow | red  | blue | rainbow |
  N    |  60%  |  20%  |  15%   |  5%  |  0%  |   0%    |
  R    |  30%  |  30%  |  25%   | 10%  |  5%  |   0%    |
  SR   |  10%  |  20%  |  30%   | 25%  | 10%  |   5%    |
  SSR  |   5%  |  10%  |  20%   | 30%  | 25%  |  10%    |
  UR   |   0%  |   5%  |  10%   | 20%  | 35%  |  30%    |
  LR   |   0%  |   0%  |   5%   | 10%  | 25%  |  60%    |
```

---

## 3. Phase 2: COUNTDOWN（カウントダウン）— 変更なし

### 素材ファイル（32本）

```
/gacha/common/countdown/cd_green_{1-8}.mp4
/gacha/common/countdown/cd_blue_{1-8}.mp4
/gacha/common/countdown/cd_red_{1-8}.mp4
/gacha/common/countdown/cd_rainbow_{1-8}.mp4
```

### カウントダウン30パターン（5グレード × 6パターン）

グレードと色の対応:
- E1（最低）: green → green → green → green
- E2: green → green → green → blue
- E3: green → blue → blue → red
- E4: blue → red → red → rainbow
- E5（最高）: red → rainbow → rainbow → rainbow

レア度に対するグレード確率（管理パネルで調整可能）:

```
       | E1   | E2   | E3   | E4   | E5   |
  N    | 60%  | 25%  | 10%  |  5%  |  0%  |
  R    | 30%  | 35%  | 25%  |  8%  |  2%  |
  SR   | 10%  | 20%  | 35%  | 25%  | 10%  |
  SSR  |  5%  | 10%  | 20%  | 35%  | 30%  |
  UR   |  0%  |  5%  | 10%  | 30%  | 55%  |
  LR   |  0%  |  0%  |  5%  | 15%  | 80%  |
```

---

## 4. Phase 3: PUCHUN / LOSS 分岐 — 変更なし

```
/gacha/common/puchun/puchun.mp4
/gacha/common/loss_card.png          ← 共通ハズレカード（全キャラ共通）
```

- isLoss === true → プチュンなし → 即 LOSS_REVEAL（共通ハズレカード表示）→ END
- isLoss === false → puchun.mp4 再生 → Phase 3.5 へ

### LOSS時の挙動（重要）

LOSSの場合、キャラクター抽選は**行わない**。共通のハズレカード（来世ガチャロゴ）を表示して終了。characterIdはデフォルト値（'kenta'）が入るが、LOSS演出では一切参照しない。

---

## 5. Phase 3.5: TITLE_VIDEO（タイトル動画 + ★期待度オーバーレイ）

### 設計思想

プチュン直後に表示される「転生先のシンボル映像」。
タイトル動画は**レア度のヒントではなく、「12種類のうちどの転生先に行くか」の示唆**。
★オーバーレイは「この転生先になれるかどうか」の期待度を示す。
全て60%ヒント方式 — ユーザーに正解と裏切りの両方を体験させる。

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
健太編で既に実装済みの StarOverlay コンポーネントをそのまま昭一編でも使用すること。
デザイン、フォント、アニメーション、配置は全て健太編と同一。変更・再実装は不要。
CharacterModule に依存しない共通コンポーネントとして扱う。
```

### ユーザー心理の設計例

```
【健太の例】
ボクシンググローブの動画 + ★★★★☆
→ 「ボクサー！？カッコいい！★4つ...期待できるかも！」
→ 60%: 本当にボクサーに転生する
→ 40%: 実は別の転生先になる

【昭一の例】
コックピットの動画 + ★★★★★
→ 「パイロット！？★5つ！すごい！」
→ 60%: 本当にパイロットに転生する
→ 40%: 実は別の転生先になる

水槽の金魚の動画 + ★☆☆☆☆
→ 「魚...？★1つ...終わった...」
→ 60%: 本当に魚に転生する
→ 40%: 実は別の（もっといい）転生先になる
```

### 動作仕様

```
1. プチュン完了後、自動遷移
2. selectTitleVideo() でタイトル動画とスター数を決定
   ※ キャラモジュールの allCardIds を使用するため、健太12種 / 昭一12種は自動で分離
3. タイトル動画（3秒）をフルスクリーン再生
4. 動画の上に★オーバーレイを表示（★が1つずつ点灯アニメーション）
5. 再生完了後 → Phase 4-A（転生前シーン）へ自動遷移
6. スキップ不可
```

### 素材ファイル

#### 健太のタイトル動画（Cloudflare）

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
```

#### 昭一のタイトル動画（Cloudflare）

```
/gacha/characters/shoichi/title/shoichi_title_c01.mp4  ← ★1 魚（暗い水槽の金魚）
/gacha/characters/shoichi/title/shoichi_title_c02.mp4  ← ★2 満員電車（異界の電車ドア）
/gacha/characters/shoichi/title/shoichi_title_c03.mp4  ← ★3 ホスト（ネオンの入口）
/gacha/characters/shoichi/title/shoichi_title_c04.mp4  ← ★4 再雇用（嘱託の小さなデスク）
/gacha/characters/shoichi/title/shoichi_title_c05.mp4  ← ★5 クマ（森の足跡 + 金色の光）
/gacha/characters/shoichi/title/shoichi_title_c06.mp4  ← ★6 イケメン（スマホ通知99+）
/gacha/characters/shoichi/title/shoichi_title_c07.mp4  ← ★7 ビーチバー（カクテル + 夕日）
/gacha/characters/shoichi/title/shoichi_title_c08.mp4  ← ★8 逆転上司（部長デスク + 夜景）
/gacha/characters/shoichi/title/shoichi_title_c09.mp4  ← ★9 青春（桜のベンチ + 忘れ物の本）
/gacha/characters/shoichi/title/shoichi_title_c10.mp4  ← ★10 幸せ家庭（4人分の朝食 + 子供靴）
/gacha/characters/shoichi/title/shoichi_title_c11.mp4  ← ★11 パイロット（コックピット + 日の出）
/gacha/characters/shoichi/title/shoichi_title_c12.mp4  ← ★12 投資家（ジェット内 + 東京夜景）
```

---

## 6. キャラクター固有モジュール

### 6-A: 健太モジュール（v1からの変更なし）

```
characterId: 'kenta'
characterName: '健太'
```

#### カード12枚

| ★ | レア度 | cardId | カード名 | コマ数 |
|---|---|---|---|---|
| 1 | N | card01_convenience | コンビニ夜勤バイト | 2 |
| 2 | N | card02_warehouse | 派遣倉庫作業員 | 2 |
| 3 | R | card03_youtuber | 底辺YouTuber | 3 |
| 4 | R | card04_civil_servant | 地方公務員 | 3 |
| 5 | SR | card05_ramen | ラーメン屋店主 | 3 |
| 6 | SR | card06_boxer | プロボクサー | 3 |
| 7 | SSR | card07_surgeon | 天才外科医 | 4 |
| 8 | SSR | card08_business_owner | 実業家 | 4 |
| 9 | UR | card09_mercenary | 異世界傭兵 | 4 |
| 10 | UR | card10_rockstar | 伝説のロックスター | 4 |
| 11 | LR | card11_demon_king | 魔王 | 5 |
| 12 | LR | card12_hero | 勇者 | 5 |

#### 転生前パターン（4種 × 2コマ）

- A: 深夜コンビニバイト → B: 雨の帰り道 → C: シフト減らされる → D: 同級生との格差

#### どんでん返しルート（10ルート）

| 偽カード | → | 実カード |
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

#### 動画素材（85本 + 共通39本）

```
/gacha/characters/kenta/title/     ← タイトル動画 12本
/gacha/characters/kenta/pre/       ← 転生前シーン 8本
/gacha/characters/kenta/chance/    ← 転生チャンスシーン 4本
/gacha/characters/kenta/main/      ← 転生先メインシーン 41本
/gacha/characters/kenta/donden/    ← どんでん返し 20本
/kenta_cards/                      ← カード画像 12枚
```

---

### 6-B: 昭一モジュール（v2 NEW）

```
characterId: 'shoichi'
characterName: '昭一'
```

#### キャラクター設定

```
名前: 田中 昭一（たなか しょういち）
年齢: 50歳
外見: 太った体型、頭頂部ハゲ、分厚い黒縁メガネ、疲れた顔
職業: 中小企業の経理課 万年平社員（30年間昇進なし）
年収: 320万円
コンセプト: 中年おじさんの人生リセット（健太=若者の逆転 との差別化）
```

#### カード12枚

| ★ | レア度 | cardId | カード名 | 転生先 | コマ数 |
|---|---|---|---|---|---|
| 1 | N | card01_fish | 魚 | 水槽の金魚に転生 | 2 |
| 2 | N | card02_train | 満員電車の男 | 永遠に降りられない満員電車 | 2 |
| 3 | R | card03_host | ホスト見習い | 合コンで誰にも相手にされない | 3 |
| 4 | R | card04_rehire | 再雇用おじさん | 定年後の再雇用で元部下に敬語 | 3 |
| 5 | SR | card05_bear | 秋田のクマ | 人里に降りて迷惑がられるクマ | 3 |
| 6 | SR | card06_ikemen | イケメン無双 | マッチングアプリで無双する超イケメン | 3 |
| 7 | SSR | card07_beach_bar | ビーチバー経営者 | タイのビーチで脱サラバー経営 | 4 |
| 8 | SSR | card08_revenge_boss | 逆転上司 | 元いじめ上司を部下に持つ | 4 |
| 9 | UR | card09_youth_love | 青春リベンジ | 20代に若返って美女と大恋愛 | 4 |
| 10 | UR | card10_happy_family | 幸せ家庭 | 綺麗な奥様＋子供2人の幸せな家庭 | 4 |
| 11 | LR | card11_pilot | 国際線パイロット | モテモテの国際線パイロット | 5 |
| 12 | LR | card12_investor | 巨額投資家 | プライベートジェット保有の大富豪 | 5 |

#### 転生前パターン（4種 × 2コマ）

- A: 満員電車の朝（圧迫 → 会社到着で無視される）
- B: 上司にいじめられる（怒鳴られる → 給湯室で一人）
- C: 独身の夜（ボロアパート帰宅 → スマホ通知ゼロ）
- D: 同窓会の屈辱（端っこで一人 → 一人で帰る夜道）

#### 転生チャンスシーン（4パターン）

- A: 光る定期券（満員電車の中で定期券が金色に光る）
- B: 光るPCモニター（オフィスでPCが白い光に）
- C: テレビの向こう（テレビ画面が異次元の扉に）
- D: 虹色の街灯（街灯が虹色に変わり魔法陣出現）

#### どんでん返しルート（10ルート）

| 偽カード | → | 実カード | ストーリー的意味 |
|---|---|---|---|
| ★1 魚 | → | ★5 クマ | 水中→陸上、小→大 |
| ★1 魚 | → | ★7 ビーチバー | 水中生物→海辺の支配者 |
| ★2 満員電車 | → | ★6 イケメン | 地獄の通勤→自由なモテ人生 |
| ★2 満員電車 | → | ★8 逆転上司 | 最底辺→大逆転出世 |
| ★3 ホスト | → | ★9 青春リベンジ | モテない→モテる逆転 |
| ★3 ホスト | → | ★11 パイロット | モテない男→超モテ男 |
| ★4 再雇用 | → | ★8 逆転上司 | 下っ端→部長 |
| ★5 クマ | → | ★10 幸せ家庭 | 孤独な野獣→家庭の温もり |
| ★6 イケメン | → | ★11 パイロット | モテるだけ→地位＋モテる |
| ★8 逆転上司 | → | ★12 投資家 | 部長→世界の投資家 |

#### 動画素材（86本）

```
/gacha/characters/shoichi/title/     ← タイトル動画 12本
/gacha/characters/shoichi/pre/       ← 転生前シーン 8本
/gacha/characters/shoichi/chance/    ← 転生チャンスシーン 4本
/gacha/characters/shoichi/main/      ← 転生先メインシーン 42本
/gacha/characters/shoichi/donden/    ← どんでん返し 20本
/shoichi_cards/                      ← カード画像 12枚
```

#### 昭一モジュール実装

```typescript
// src/lib/gacha/characters/shoichi/shoichi-module.ts

import { CharacterModule } from '../../common/types';
import { registerCharacter } from '../character-registry';

const shoichiModule: CharacterModule = {
  characterId: 'shoichi',
  characterName: '昭一',

  cards: [
    { cardId: 'card01_fish', name: '魚', title: '水槽の金魚', rarity: 'N', starRating: 1, mainSceneSteps: 2 },
    { cardId: 'card02_train', name: '満員電車の男', title: '永遠に降りられない電車', rarity: 'N', starRating: 2, mainSceneSteps: 2 },
    { cardId: 'card03_host', name: 'ホスト見習い', title: 'モテない夜の戦士', rarity: 'R', starRating: 3, mainSceneSteps: 3 },
    { cardId: 'card04_rehire', name: '再雇用おじさん', title: '定年後の嘱託社員', rarity: 'R', starRating: 4, mainSceneSteps: 3 },
    { cardId: 'card05_bear', name: '秋田のクマ', title: '人里に降りた熊', rarity: 'SR', starRating: 5, mainSceneSteps: 3 },
    { cardId: 'card06_ikemen', name: 'イケメン無双', title: 'マッチングアプリの覇者', rarity: 'SR', starRating: 6, mainSceneSteps: 3 },
    { cardId: 'card07_beach_bar', name: 'ビーチバー経営者', title: 'タイの自由人', rarity: 'SSR', starRating: 7, mainSceneSteps: 4 },
    { cardId: 'card08_revenge_boss', name: '逆転上司', title: '復讐を超えた部長', rarity: 'SSR', starRating: 8, mainSceneSteps: 4 },
    { cardId: 'card09_youth_love', name: '青春リベンジ', title: '22歳の大恋愛', rarity: 'UR', starRating: 9, mainSceneSteps: 4 },
    { cardId: 'card10_happy_family', name: '幸せ家庭', title: '4人家族の父', rarity: 'UR', starRating: 10, mainSceneSteps: 4 },
    { cardId: 'card11_pilot', name: '国際線パイロット', title: 'モテモテキャプテン', rarity: 'LR', starRating: 11, mainSceneSteps: 5 },
    { cardId: 'card12_investor', name: '巨額投資家', title: 'プライベートジェットの男', rarity: 'LR', starRating: 12, mainSceneSteps: 5 },
  ],

  preScenePatterns: [
    { patternId: 'A', steps: 2 },
    { patternId: 'B', steps: 2 },
    { patternId: 'C', steps: 2 },
    { patternId: 'D', steps: 2 },
  ],

  chanceScenes: [
    { patternId: 'A' },
    { patternId: 'B' },
    { patternId: 'C' },
    { patternId: 'D' },
  ],

  dondenRoutes: [
    { fromCardId: 'card01_fish', toCardId: 'card05_bear', steps: 2 },
    { fromCardId: 'card01_fish', toCardId: 'card07_beach_bar', steps: 2 },
    { fromCardId: 'card02_train', toCardId: 'card06_ikemen', steps: 2 },
    { fromCardId: 'card02_train', toCardId: 'card08_revenge_boss', steps: 2 },
    { fromCardId: 'card03_host', toCardId: 'card09_youth_love', steps: 2 },
    { fromCardId: 'card03_host', toCardId: 'card11_pilot', steps: 2 },
    { fromCardId: 'card04_rehire', toCardId: 'card08_revenge_boss', steps: 2 },
    { fromCardId: 'card05_bear', toCardId: 'card10_happy_family', steps: 2 },
    { fromCardId: 'card06_ikemen', toCardId: 'card11_pilot', steps: 2 },
    { fromCardId: 'card08_revenge_boss', toCardId: 'card12_investor', steps: 2 },
  ],

  getTitleVideoPath: (cardId) =>
    `/gacha/characters/shoichi/title/shoichi_title_${cardId.replace('card', 'c')}.mp4`,
  getPreSceneVideoPath: (patternId, step) =>
    `/gacha/characters/shoichi/pre/shoichi_pre_${patternId.toLowerCase()}${step}.mp4`,
  getChanceSceneVideoPath: (patternId) =>
    `/gacha/characters/shoichi/chance/shoichi_chance_${patternId.toLowerCase()}.mp4`,
  getMainSceneVideoPath: (cardId, step) =>
    `/gacha/characters/shoichi/main/shoichi_${cardId.replace('card', 'c')}_${step}.mp4`,
  getDondenVideoPath: (fromCardId, toCardId, step) =>
    `/gacha/characters/shoichi/donden/shoichi_rev_${fromCardId.replace('card', 'c')}_${toCardId.replace('card', 'c')}_${step}.mp4`,
  getCardImagePath: (cardId) =>
    `/shoichi_cards/shoichi_${cardId}.png`,
  getCardDisplayInfo: (cardId) => {
    const card = shoichiModule.cards.find(c => c.cardId === cardId);
    return card
      ? { name: card.name, title: card.title, description: '', rarity: card.rarity, starRating: card.starRating }
      : { name: '???', title: '???', description: '', rarity: 'N' as const, starRating: 0 };
  },
};

registerCharacter(shoichiModule);
export default shoichiModule;
```

---

## 7. 抽選ロジック（v2: マルチキャラ対応）

### 抽選順序

```
1. ハズレ / 当たり判定（共通 loss_rate）
   ├── ハズレ → GachaResult(isLoss=true) を返す。キャラ抽選しない。
   └── 当たり ↓
2. キャラクター抽選（character_weights に基づく）
   例: { kenta: 60, shoichi: 40 } → 60%で健太、40%で昭一
3. 選ばれたキャラの★レベル抽選（character_rtp に基づく）
   例: 昭一の場合 { N: 35, R: 25, SR: 20, SSR: 12, UR: 6, LR: 2 }
4. ★レベルに一致するカードから1枚を均等確率で選択
   例: SR(★5-6) が当たり → card05_bear or card06_ikemen を50%ずつ
5. どんでん返し判定（キャラ別 donden_rate に基づく）
```

### Supabase テーブル設計（v2）

```sql
-- =============================================
-- v2: キャラクター設定テーブル（NEW）
-- =============================================
CREATE TABLE gacha_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id TEXT NOT NULL UNIQUE,          -- 'kenta', 'shoichi'
  character_name TEXT NOT NULL,               -- '健太', '昭一'
  is_active BOOLEAN NOT NULL DEFAULT true,    -- 有効/無効フラグ
  weight NUMERIC NOT NULL DEFAULT 50,         -- キャラ出現率（相対比率）
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 初期データ
INSERT INTO gacha_characters (character_id, character_name, weight) VALUES
  ('kenta', '健太', 60),
  ('shoichi', '昭一', 40);

-- =============================================
-- v2: キャラ別RTP設定テーブル（gacha_rtp_config を拡張）
-- =============================================
CREATE TABLE gacha_rtp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id TEXT NOT NULL REFERENCES gacha_characters(character_id),
  loss_rate NUMERIC NOT NULL DEFAULT 60,      -- ハズレ率（キャラ共通だが、将来キャラ別にも可能）
  rarity_n NUMERIC NOT NULL DEFAULT 35,
  rarity_r NUMERIC NOT NULL DEFAULT 25,
  rarity_sr NUMERIC NOT NULL DEFAULT 20,
  rarity_ssr NUMERIC NOT NULL DEFAULT 12,
  rarity_ur NUMERIC NOT NULL DEFAULT 6,
  rarity_lr NUMERIC NOT NULL DEFAULT 2,
  donden_rate NUMERIC NOT NULL DEFAULT 15,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(character_id)
);

-- 初期データ: 健太
INSERT INTO gacha_rtp_config (character_id, loss_rate, rarity_n, rarity_r, rarity_sr, rarity_ssr, rarity_ur, rarity_lr, donden_rate) VALUES
  ('kenta', 60, 35, 25, 20, 12, 6, 2, 15);

-- 初期データ: 昭一
INSERT INTO gacha_rtp_config (character_id, loss_rate, rarity_n, rarity_r, rarity_sr, rarity_ssr, rarity_ur, rarity_lr, donden_rate) VALUES
  ('shoichi', 60, 35, 25, 20, 12, 6, 2, 15);

-- =============================================
-- 共通設定テーブル（v2: loss_rate を共通に管理するオプション）
-- =============================================
CREATE TABLE gacha_global_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loss_rate NUMERIC NOT NULL DEFAULT 60,      -- 共通ハズレ率
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO gacha_global_config (loss_rate) VALUES (60);

-- =============================================
-- 演出確率テーブル（v1と同一、変更なし）
-- =============================================
CREATE TABLE gacha_presentation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_type TEXT NOT NULL,
  rarity TEXT NOT NULL,
  probabilities JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 抽選ロジック実装（v2）

```typescript
interface GlobalConfig {
  lossRate: number;
}

interface CharacterWeight {
  characterId: CharacterId;
  weight: number;
  isActive: boolean;
}

interface CharacterRTP {
  rarityDistribution: Record<Rarity, number>;
  dondenRate: number;
}

async function drawGacha(): Promise<GachaResult> {
  // 1. 共通設定を取得
  const globalConfig = await getGlobalConfig();

  // 2. ハズレ / 当たり判定
  const isLoss = Math.random() * 100 < globalConfig.lossRate;

  if (isLoss) {
    return {
      isLoss: true,
      characterId: 'kenta',  // デフォルト値（LOSS時は参照しない）
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

  // 3. キャラクター抽選
  const characters = await getActiveCharacters();  // is_active=true のみ
  const characterId = drawCharacter(characters);

  // 4. キャラ別RTP取得 & レア度抽選
  const rtp = await getCharacterRTP(characterId);
  const rarity = drawRarity(rtp.rarityDistribution);

  // 5. カードを選択（同レア度内で均等確率）
  const card = selectCardByRarity(characterId, rarity);

  // 6. どんでん返し判定
  const isDonden = Math.random() * 100 < rtp.dondenRate;
  let dondenFromCardId: string | undefined;
  let dondenFromRarity: Rarity | undefined;

  if (isDonden) {
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
    cardImagePath: getCharacter(characterId).getCardImagePath(card.cardId),
    isDonden: !!dondenFromCardId,
    dondenFromCardId,
    dondenFromRarity,
    isSequel: false,
  };
}

/**
 * キャラクター抽選（加重ランダム）
 */
function drawCharacter(characters: CharacterWeight[]): CharacterId {
  const totalWeight = characters.reduce((sum, c) => sum + c.weight, 0);
  let random = Math.random() * totalWeight;
  for (const c of characters) {
    random -= c.weight;
    if (random <= 0) return c.characterId;
  }
  return characters[0].characterId;  // フォールバック
}
```

---

## 8. 管理者パネル仕様（v2: マルチキャラ対応）

### 画面構成

```
/admin
  ├── /admin/global          ← 共通設定（ハズレ率）
  ├── /admin/characters      ← キャラクター別設定（NEW）
  ├── /admin/presentations   ← 演出確率設定（STANDBY色・カウントダウングレード）
  └── /admin/countdown-patterns ← カウントダウンパターン管理
```

### /admin/global（共通設定）

```
■ 共通ハズレ率
  - スライダー: 0〜100%
  - 現在値表示: 「60%」
  - 説明: 「全ガチャ共通のハズレ率。当たりの場合のみキャラ抽選に進む」
```

### /admin/characters（キャラクター別設定）— NEW

```
■ キャラクター一覧テーブル
  | キャラ名 | ID | 有効 | 出現率 | 編集 |
  |---------|-----|------|-------|------|
  | 健太    | kenta   | ✅ ON  | 60  | [編集] |
  | 昭一    | shoichi | ✅ ON  | 40  | [編集] |

  - 出現率は相対比率（合計100である必要はないが、100推奨。画面に換算%を表示）
  - 有効フラグをOFFにすると、そのキャラは抽選から除外
  - 全キャラOFFの場合はエラー表示

■ キャラ詳細設定モーダル（[編集]クリック時）
  
  タブ1: 基本設定
    - キャラ名（表示用）
    - 出現率（weight）: 数値入力 0〜100
    - 有効/無効トグル

  タブ2: ★別出現率（RTP）
    - レア度ごとのスライダー or 数値入力:
      N (★1-2):  [35] %
      R (★3-4):  [25] %
      SR (★5-6): [20] %
      SSR(★7-8): [12] %
      UR (★9-10): [6] %
      LR (★11-12): [2] %
    - 合計: 100% ← リアルタイムバリデーション
    - 合計が100%でない場合: 赤文字警告「合計が100%になっていません」
    - [他のキャラからコピー]ボタン: 健太の設定をコピーなど

  タブ3: どんでん返し設定
    - どんでん返し発動率: スライダー 0〜100%
    - どんでん返しルート一覧（読み取り専用）

  タブ4: カード一覧
    - 全12枚のカード一覧表示（cardId, 名前, ★, レア度, コマ数）
    - 読み取り専用（カード追加・変更はコードデプロイで対応）
```

### バリデーションルール

```
1. キャラ出現率（weight）:
   - 0以上の整数
   - 全有効キャラのweight合計が0の場合 → エラー「最低1キャラの出現率を1以上にしてください」

2. ★別出現率（RTP）:
   - 各レア度: 0以上の数値
   - 全レア度の合計: 100%（許容誤差: ±0.1%）
   - 合計が100%でない場合 → 保存ボタン無効化 + 警告表示

3. どんでん返し発動率:
   - 0〜100の数値

4. 保存時:
   - サーバーサイドでも再バリデーション
   - 変更履歴をログテーブルに記録
   - Supabase realtime で他の管理画面にも即反映
```

---

## 9. Phase 5: CARD_REVEAL（カード結果表示）— 変更なし

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

---

## 10. ディレクトリ構成（v2）

```
src/
  app/
    page.tsx                         ← メインページ
    admin/
      page.tsx                       ← 管理パネルダッシュボード
      global/page.tsx                ← 共通設定（ハズレ率）← NEW
      characters/page.tsx            ← キャラクター別設定 ← NEW
      presentations/page.tsx         ← 演出確率設定
      countdown-patterns/page.tsx    ← カウントダウンパターン管理
    api/
      gacha/
        draw/route.ts                ← 抽選API（v2: マルチキャラ対応）
        config/route.ts              ← 設定API
  lib/
    gacha/
      common/
        gacha-engine.ts              ← 共通演出エンジン（Phase 1-3）
        standby-selector.ts
        countdown-selector.ts
        title-video-selector.ts
        types.ts
      characters/
        kenta/
          kenta-module.ts
        shoichi/                     ← NEW
          shoichi-module.ts          ← 昭一固有モジュール
        character-registry.ts        ← キャラ登録・切替
    supabase/
      client.ts
      config.ts                      ← v2: キャラ別設定 CRUD
  components/
    gacha/
      GachaPlayer.tsx                ← メインプレイヤーUI（v1と同一）
      phases/
        StandbyPhase.tsx
        CountdownPhase.tsx
        PuchunPhase.tsx
        TitleVideoPhase.tsx
        LossRevealPhase.tsx
        PreScenePhase.tsx
        ChanceScenePhase.tsx
        MainScenePhase.tsx
        DondenScenePhase.tsx
        CardRevealPhase.tsx
      overlays/
        StarOverlay.tsx
        ColorFlashOverlay.tsx
        SkipButton.tsx
        NextButton.tsx
    admin/
      GlobalConfigEditor.tsx         ← NEW
      CharacterEditor.tsx            ← NEW
      CharacterRTPEditor.tsx         ← NEW
      PresentationEditor.tsx
      CountdownPatternEditor.tsx

Cloudflare (動画・画像配信):
  /gacha/common/standby/             ← STANDBY動画 6本
  /gacha/common/countdown/           ← カウントダウン動画 32本
  /gacha/common/puchun/              ← プチュン動画 1本
  /gacha/common/loss_card.png        ← 共通ハズレカード
  /gacha/characters/kenta/title/     ← 健太タイトル動画 12本
  /gacha/characters/kenta/pre/       ← 健太転生前シーン 8本
  /gacha/characters/kenta/chance/    ← 健太転生チャンスシーン 4本
  /gacha/characters/kenta/main/      ← 健太転生先メインシーン 41本
  /gacha/characters/kenta/donden/    ← 健太どんでん返し 20本
  /kenta_cards/                      ← 健太カード画像 12枚
  /gacha/characters/shoichi/title/   ← 昭一タイトル動画 12本 ← NEW
  /gacha/characters/shoichi/pre/     ← 昭一転生前シーン 8本 ← NEW
  /gacha/characters/shoichi/chance/  ← 昭一転生チャンスシーン 4本 ← NEW
  /gacha/characters/shoichi/main/    ← 昭一転生先メインシーン 42本 ← NEW
  /gacha/characters/shoichi/donden/  ← 昭一どんでん返し 20本 ← NEW
  /shoichi_cards/                    ← 昭一カード画像 12枚 ← NEW
```

---

## 11. 全動画素材一覧（v2）

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
| 昭一: タイトル動画 | 12本 | shoichi_title_c{XX}.mp4 | ✅完成 |
| 昭一: 転生前シーン | 8本 | shoichi_pre_{pattern}{step}.mp4 | ✅完成 |
| 昭一: 転生チャンスシーン | 4本 | shoichi_chance_{pattern}.mp4 | ✅完成 |
| 昭一: 転生先メインシーン | 42本 | shoichi_c{XX}_{step}.mp4 | ✅完成 |
| 昭一: どんでん返し | 20本 | shoichi_rev_c{from}_c{to}_{step}.mp4 | ✅完成 |
| **合計** | **210本** | | |

カード画像:
| カテゴリ | 枚数 | 状態 |
|---|---|---|
| 共通: ハズレカード | 1枚 | ✅完成 |
| 健太: カード画像 | 12枚 | ✅完成 |
| 昭一: カード画像 | 12枚 | ✅完成 |
| **合計** | **25枚** | |

---

## 12. メインプレイヤー実装（v2: 変更箇所は最小限）

GachaPlayer.tsx の変更点: **characterId に基づいてキャラモジュールをロードするだけ**。Phase遷移ロジックは一切変更なし。

```typescript
export function GachaPlayer({ gachaResult }: { gachaResult: GachaResult }) {
  const [phase, setPhase] = useState<GachaPhase>('STANDBY');
  const [preScenePattern, setPreScenePattern] = useState<string>('');

  // v2: characterId に基づいてキャラモジュールを取得
  // getCharacter() は character-registry から取得するだけ
  const character = gachaResult.isLoss
    ? null
    : getCharacter(gachaResult.characterId);  // ← 'kenta' or 'shoichi'

  // 以下、v1と完全に同一（変更なし）
  // ...
}
```

---

## 13. 動画プリロード戦略 — v1と同一（変更なし）

プリロードロジックはキャラモジュールの `getXXXVideoPath()` メソッドを使ってURLを取得するため、昭一追加による変更は不要。

---

## 14. マイグレーション方針（v1 → v2）

### 手順

```
1. DBマイグレーション:
   a. gacha_characters テーブル作成
   b. 健太レコード挿入: { character_id: 'kenta', weight: 100 }
   c. 昭一レコード挿入: { character_id: 'shoichi', weight: 0, is_active: false }
   d. gacha_rtp_config に character_id カラム追加（既存データは 'kenta' に紐付け）
   e. gacha_global_config テーブル作成（既存 loss_rate を移行）

2. コードデプロイ:
   a. shoichi-module.ts を追加
   b. character-registry.ts に昭一を登録
   c. 抽選ロジックを v2 に更新（drawGacha関数）
   d. 管理パネルに /admin/characters ページ追加
   e. /admin/global ページ追加

3. Cloudflare に昭一動画素材アップロード:
   a. /gacha/characters/shoichi/ 以下に86本
   b. /shoichi_cards/ に12枚

4. 管理パネルから昭一を有効化:
   a. 昭一の is_active を true に変更
   b. 昭一の weight を 40 に設定（健太 60: 昭一 40）
   c. 昭一のRTPを確認・調整

※ 手順4を行うまでは、既存の健太のみの挙動が維持される（安全なデプロイ）
```

### ロールバック方法

```
- 管理パネルで昭一の is_active を false にするだけで、即座に健太のみの状態に戻る
- コードロールバックは不要（昭一モジュールは存在するが、is_active=false なら抽選されない）
```

---

## 15. 新キャラ追加手順（Claude Code向け・v2更新）

```
1. src/lib/gacha/characters/{新キャラID}/ フォルダ作成
2. {新キャラ}-module.ts 作成 — CharacterModule インターフェース準拠
3. character-registry.ts に registerCharacter() で登録
4. Cloudflare に動画・画像素材をアップロード
5. DBに gacha_characters レコード追加（is_active=false, weight=0 で安全に）
6. DBに gacha_rtp_config レコード追加（デフォルト値 or 健太コピー）
7. 管理パネルから is_active=true, weight を設定して有効化

※ Phase 1〜3（STANDBY・COUNTDOWN・PUCHUN）のコードは一切変更しない
※ GachaPlayer.tsx のPhase遷移ロジックは一切変更しない
※ 共通テンプレートのコードには触れない
```

---

## 16. 実装ルール（Claude Codeへの指示）

1. **Phase 1〜3 のコードにキャラ固有情報を含めない**
2. **キャラクター選択はサーバーサイドで完結** — クライアントはcharacterIdに基づいてモジュールをロードするだけ
3. **演出選択はクライアントサイド** — サーバーは `GachaResult` のみ返す
4. **ハズレ/当たり判定はサーバーサイド** — `isLoss` フラグを信頼して分岐
5. **プチュンの有無 = 当たり/ハズレの唯一の分岐点** — 曖昧にしない
6. **LOSS時はキャラモジュールを一切使わない** — 共通ハズレカードのみ
7. **動画一括プリロードを必ず実装** — STANDBY中に全動画を一括プリロード
8. **Cloudflare CDN からの動画配信** — `/gacha/` パス以下
9. **管理パネルの変更は即時反映** — Supabase realtime or revalidate
10. **全確率テーブルは管理パネルから変更可能** — ハードコード禁止
11. **TypeScript strict mode** — 型安全性を確保
12. **モバイルファースト** — 9:16 縦動画前提のUI設計
13. **キャラ追加時にGachaPlayer.tsxを変更しない** — character-registry経由で自動解決
