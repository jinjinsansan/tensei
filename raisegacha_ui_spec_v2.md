# 来世ガチャ UI リデザイン仕様書 v2

> **サイト名**: 来世ガチャ ～もしも生まれ変わったら～
> **世界観**: 輪廻の書庫 — 天空の図書館
> **デザイン言語**: Tria風ダークモダン（黒なのに暗くない、洗練されたダーク UI）
> **対象プロジェクト**: tensei-gacha（尊師ガチャ V4 からの移植）

---

## 0. この仕様書の目的

尊師ガチャ V4 のロジック・API・DB 設計はそのまま流用し、**サイト全体の見た目・世界観・テキスト・演出**を変更する。

**原則:**
- ガチャエンジン（RTP / どんでん / 追撃 / カード配布）のロジックは一切変更しない
- API のリクエスト・レスポンス構造は変更しない
- 変更するのは UI コンポーネント、CSS / Tailwind クラス、テキスト、画像アセットのみ

---

## 1. デザイン方針: Tria 風ダークモダン

### 1.1 Tria のデザインから学ぶべきポイント

Tria（暗号資産ウォレット）のUIを参考にする。以下がTriaの特徴:

1. **背景は真っ黒ではなくわずかに暖かみのあるダークグレー** — `#0A0A0A` ～ `#111111` 程度。完全な `#000000` は使わない
2. **カード/セクションは微妙に明るいグレー背景** — `#1A1A1A` ～ `#1E1E1E` で浮かせる。境界は `border: 1px solid rgba(255,255,255,0.08)` のような超薄いボーダー
3. **アクセントカラーはイエローゴールド** — `#F5A623` ～ `#FFD700` 系。CTAボタン、重要ラベル、強調テキストに使用
4. **テキストは純白ではなくわずかにグレー** — メインテキストが `#E5E5E5`、サブテキストが `#888888` ～ `#999999`
5. **赤/緑はデータ表示用** — 下落は `#FF4D4D`（明るい赤）、上昇は `#4ADE80`（明るい緑）
6. **角丸は大きめ** — カード `border-radius: 16px`、ボタン `border-radius: 12px`、小要素 `8px`
7. **フォントはゴシック系モダン** — 細すぎず太すぎない。font-weight 400〜600が中心
8. **スペーシングに余裕** — 詰め込みすぎず、要素間に十分な余白。padding は 20px〜24px が基本
9. **ゴールド系のボーダーで重要カードを強調** — `border: 1px solid rgba(245,166,35,0.5)` のような半透明ゴールドボーダー
10. **全体的にフラット** — 影は控えめ。立体感はボーダーと背景色の差で出す

### 1.2 Tria との差別化ポイント

Triaは金融アプリなので、来世ガチャでは以下を加える:
- 世界観テキスト（本・書庫のメタファー）
- ガチャ演出時のパーティクルやアニメーション
- カードデザインにファンタジー要素（レア度別の装飾）

ただし**ベースのUI/カラーは完全にTria準拠**にする。

---

## 2. デザインシステム

### 2.1 カラーパレット（Tria準拠）

```css
:root {
  /* ========================================
     Background — 黒だけど暗くない、微かに暖かいダーク
     ======================================== */
  --bg-primary:      #0A0A0A;   /* 最も暗い背景（ページ全体） */
  --bg-secondary:    #111111;   /* セクション背景 */
  --bg-card:         #1A1A1A;   /* カード・パネル背景 */
  --bg-card-hover:   #222222;   /* カードホバー時 */
  --bg-elevated:     #1E1E1E;   /* モーダル・ドロップダウン */
  --bg-input:        #1A1A1A;   /* 入力フォームの背景 */

  /* ========================================
     Border — 超薄いホワイト系ボーダー
     ======================================== */
  --border-default:  rgba(255, 255, 255, 0.08);  /* 通常のカード境界 */
  --border-light:    rgba(255, 255, 255, 0.12);  /* ホバー時・強調 */
  --border-accent:   rgba(245, 166, 35, 0.4);    /* ゴールドボーダー（重要カード） */
  --border-accent-strong: rgba(245, 166, 35, 0.7); /* 強いゴールドボーダー */

  /* ========================================
     Text — 純白にしない。わずかにグレーで上品に
     ======================================== */
  --text-primary:    #E5E5E5;   /* メインテキスト（白に近いグレー） */
  --text-secondary:  #999999;   /* サブテキスト・補足 */
  --text-tertiary:   #666666;   /* さらに薄い・ラベル */
  --text-accent:     #F5A623;   /* ゴールド強調テキスト */
  --text-white:      #FFFFFF;   /* ここぞという強調（タイトル等） */

  /* ========================================
     Accent — Tria のイエローゴールド
     ======================================== */
  --accent-primary:      #F5A623;   /* メインアクセント（ゴールド） */
  --accent-primary-hover: #FFB83D;  /* ホバー時 */
  --accent-primary-dim:  rgba(245, 166, 35, 0.15); /* 薄いゴールド背景 */
  --accent-secondary:    #FFD700;   /* 明るいゴールド（大当たり等） */
  --accent-warm:         #FF8C00;   /* オレンジゴールド（CTAボタン等） */

  /* ========================================
     Semantic
     ======================================== */
  --color-success:   #4ADE80;   /* 成功・上昇（明るい緑） */
  --color-error:     #FF4D4D;   /* エラー・下落（明るい赤） */
  --color-warning:   #F5A623;   /* 警告（ゴールド） */
  --color-info:      #60A5FA;   /* 情報（明るい青） */

  /* ========================================
     Card Rarity — レア度別カラー
     ======================================== */
  --rarity-n:    #666666;   /* N — グレー */
  --rarity-r:    #4ADE80;   /* R — グリーン */
  --rarity-sr:   #60A5FA;   /* SR — ブルー */
  --rarity-ssr:  #F5A623;   /* SSR — ゴールド */
  --rarity-ur:   #C084FC;   /* UR — パープル */
  --rarity-lr:   #FFD700;   /* LR — 輝くゴールド + アニメーション */
}
```

### 2.2 Tailwind CSS 設定

`tailwind.config.ts` の `extend.colors` に以下を追加:

```ts
export default {
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0A0A0A',
          secondary: '#111111',
          card: '#1A1A1A',
          'card-hover': '#222222',
          elevated: '#1E1E1E',
          input: '#1A1A1A',
        },
        accent: {
          DEFAULT: '#F5A623',
          hover: '#FFB83D',
          dim: 'rgba(245, 166, 35, 0.15)',
          bright: '#FFD700',
          warm: '#FF8C00',
        },
        text: {
          primary: '#E5E5E5',
          secondary: '#999999',
          tertiary: '#666666',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          light: 'rgba(255, 255, 255, 0.12)',
        },
        rarity: {
          n: '#666666',
          r: '#4ADE80',
          sr: '#60A5FA',
          ssr: '#F5A623',
          ur: '#C084FC',
          lr: '#FFD700',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans JP', 'Hiragino Sans', 'sans-serif'],
        display: ['Inter', 'Noto Sans JP', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'button': '12px',
        'badge': '8px',
      },
    },
  },
}
```

### 2.3 フォント

Triaはモダンゴシック。来世ガチャも同じ方向にする:

```
■ 全体:
  font-family: 'Inter', 'Noto Sans JP', 'Hiragino Sans', sans-serif;
  -webkit-font-smoothing: antialiased;

■ ウェイト:
  見出し:     font-weight: 700 (bold)
  本文:       font-weight: 400 (regular)
  ボタン:     font-weight: 600 (semibold)
  サブテキスト: font-weight: 400 (regular)

■ サイズ:
  ページタイトル:  text-2xl (24px)
  セクション見出し: text-lg (18px)
  本文:          text-base (16px)
  サブテキスト:   text-sm (14px)
  バッジ/ラベル:  text-xs (12px)
```

**Google Fonts 読み込み (`layout.tsx`):**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
```

※ セリフ体は使わない。Triaのクリーンさを維持する。世界観は**テキスト内容とアイコン**で表現する。

### 2.4 背景

```css
body {
  background-color: #0A0A0A;
  color: #E5E5E5;
}
```

グラデーションは使わない。**フラットな単色ダーク背景**がTriaの特徴。

---

## 3. 共通 UI コンポーネント仕様

### 3.1 カード（パネル）

Triaの最も重要なUIパターン。すべてのセクションで使う。

```css
.card {
  background: #1A1A1A;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
}

.card:hover {
  background: #222222;
  border-color: rgba(255, 255, 255, 0.12);
}

/* 重要カード（ゴールドボーダー） */
.card-accent {
  background: #1A1A1A;
  border: 1px solid rgba(245, 166, 35, 0.4);
  border-radius: 16px;
  padding: 20px;
}

/* ゴールドボーダー強調版（Triaのリワード画面風） */
.card-highlight {
  background: #1A1A1A;
  border: 1px solid rgba(245, 166, 35, 0.7);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 0 20px rgba(245, 166, 35, 0.08);
}
```

**Tailwind クラス例:**
```
通常カード:    bg-bg-card border border-white/[0.08] rounded-[16px] p-5
強調カード:    bg-bg-card border border-accent/40 rounded-[16px] p-5
ハイライト:    bg-bg-card border border-accent/70 rounded-[16px] p-6 shadow-[0_0_20px_rgba(245,166,35,0.08)]
```

### 3.2 ボタン

#### プライマリボタン（CTA）
```css
.btn-primary {
  background: #F5A623;
  color: #000000;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  font-size: 15px;
  transition: background 0.2s;
}
.btn-primary:hover {
  background: #FFB83D;
}
```

**Tailwind:** `bg-accent text-black font-semibold py-3 px-6 rounded-[12px] hover:bg-accent-hover transition-colors`

#### セカンダリボタン（アウトライン）
```css
.btn-secondary {
  background: transparent;
  color: #E5E5E5;
  font-weight: 500;
  padding: 12px 24px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: all 0.2s;
}
.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.25);
}
```

**Tailwind:** `bg-transparent text-text-primary font-medium py-3 px-6 rounded-[12px] border border-white/15 hover:bg-white/5 hover:border-white/25 transition-all`

#### テキストボタン（リンク風）
```css
.btn-text {
  background: transparent;
  color: #F5A623;
  font-weight: 500;
  padding: 8px 16px;
  border: none;
}
.btn-text:hover {
  color: #FFB83D;
}
```

### 3.3 バッジ / ラベル

Triaの「ベータ」バッジや「最大+3x倍率」のようなラベル:

```css
/* ゴールドバッジ */
.badge-gold {
  background: rgba(245, 166, 35, 0.15);
  color: #F5A623;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 8px;
}

/* グリーンバッジ（成功系） */
.badge-green {
  background: rgba(74, 222, 128, 0.15);
  color: #4ADE80;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 8px;
}

/* グレーバッジ（デフォルト） */
.badge-gray {
  background: rgba(255, 255, 255, 0.08);
  color: #999999;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 8px;
}
```

### 3.4 入力フォーム

```css
.input {
  background: #1A1A1A;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 12px 16px;
  color: #E5E5E5;
  font-size: 15px;
}
.input:focus {
  border-color: #F5A623;
  outline: none;
  box-shadow: 0 0 0 2px rgba(245, 166, 35, 0.2);
}
.input::placeholder {
  color: #666666;
}
```

### 3.5 区切り線

```css
.divider {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
```

Triaは装飾的な罫線を使わない。シンプルな1px線のみ。

### 3.6 ナビゲーションバー（上部）

Triaのトップバーを参考に:

```css
.navbar {
  background: #0A0A0A;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 12px 20px;
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(20px);
}
```

---

## 4. 用語マッピング（旧 → 新）

すべてのファイルで以下のテキスト置換を実施:

| 尊師ガチャ（旧） | 来世ガチャ（新） | 使用箇所 |
|---|---|---|
| 尊師ガチャ | 来世ガチャ | サイト名、タイトル全般 |
| ガチャを回す / ガチャを引く | 本を開く | ボタンラベル、説明文 |
| チケット | 栞（しおり） | チケット残高、消費表示 |
| フリーチケット | 無料の栞 | チケット種別名 |
| ベーシックチケット | 銅の栞 | チケット種別名 |
| プレミアムチケット | 銀の栞 | チケット種別名 |
| VIPチケット | 金の栞 | チケット種別名 |
| カード | 物語の書 | カード表示、取得通知 |
| 図鑑 | 書架（しょか） | ナビゲーション、ページタイトル |
| コレクション | 書架 | ナビゲーション、ページタイトル |
| もう1回 | もう1冊 | 結果画面のボタン |
| ハズレ | 白紙の章 | 結果テキスト |
| 当たり | 新章開幕 | 結果テキスト |
| 大当たり | 名著発見 | 結果テキスト |
| 超大当たり | 伝説の書 | 結果テキスト |
| ジャックポット | 禁断の魔導書 | 結果テキスト |
| どんでん返し | 隠された章 | 演出テロップ |
| 追撃 / 追撃チャンス | 続編（Sequel） | 演出テロップ |
| 追撃成功 | 続編開幕 | 演出テロップ |
| 追撃失敗 | 続編なし（完結） | 演出テロップ |
| 継続 / コンティニュー | 次のページへ | 演出テロップ |
| マイページ | 書斎（しょさい） | ナビゲーション |
| ホーム | ホーム | ナビゲーション（そのまま） |
| ガチャホール | 閲覧室 | ガチャ選択画面 |
| ログインボーナス | 日替わりの栞 | ログインボーナス |
| 紹介コード | 招待状 | 紹介機能 |

---

## 5. 画面別 UI 仕様

### 5.1 スプラッシュ画面 (`SplashGateway`)

**ファイル:** `src/components/landing/splash-gateway.tsx`

```
背景:     #0A0A0A（フラット）
レイアウト: 画面中央にロゴとボタン

┌──────────────────────────┐
│                          │
│        （余白）            │
│                          │
│   📖                     │  ← 本のアイコン（シンプルなSVGアウトライン、ゴールド色）
│                          │
│   来世ガチャ               │  ← text-2xl font-bold text-white
│  ～もしも生まれ変わったら～  │  ← text-sm text-text-secondary mt-2
│                          │
│        （余白）            │
│                          │
│  [ 書庫に入る ]            │  ← プライマリボタン（ゴールド bg-accent text-black）
│                          │     幅は px-12 程度、中央配置
│                          │
│   輪廻の書庫               │  ← text-xs text-text-tertiary mt-8
│                          │
└──────────────────────────┘
```

**ポイント:**
- 過剰なアニメーションは不要。Triaのようにシンプルに
- ボタンだけが目立つ設計
- アイコンはアウトライン系（塗りつぶさない）、色は `#F5A623`

### 5.2 ホーム画面 (`/home`, `HomeDashboard`)

**ファイル:** `src/components/home/home-dashboard.tsx`

Triaのホーム画面をそのまま参考に:

```
┌──────────────────────────┐
│  来世ガチャ                │  ← ナビバー（sticky、bg-bg-primary）
│  ─────────────────────── │  ← 1px border-bottom
│                          │
│  ┌─ 日替わりの栞 ─────────┐│  ← card-accent（ゴールドボーダー）
│  │                       ││     Triaの「Triaカードを取得」と同じレイアウト
│  │  📖 銅の栞 ×1 獲得！   ││  ← テキスト text-accent
│  │                       ││
│  │  [ 受け取る ]          ││  ← 小さめのプライマリボタン
│  └───────────────────────┘│
│                          │
│  栞の残高                  │  ← text-lg font-bold mb-4
│  ┌───────┐ ┌───────┐     │  ← 横スクロールカルーセル
│  │ 無料   │ │ 銅    │     │     各カードは bg-bg-card + border
│  │  3     │ │  2    │     │     数字は text-2xl font-bold
│  │        │ │       │     │     種別名は text-sm text-text-secondary
│  └───────┘ └───────┘     │
│                          │
│  ┌───────────────────────┐│  ← card-highlight（ゴールド強め）
│  │  次の物語を開きましょう  ││  ← text-accent font-bold
│  │                       ││
│  │  [ 閲覧室へ ]          ││  ← プライマリボタン（大きめ、幅100%）
│  └───────────────────────┘│
│                          │
│  最近の物語                │  ← text-lg font-bold mb-3
│  ┌───────────────────────┐│
│  │ SSR コンビニ王 健太     ││  ← リストアイテム
│  ├───────────────────────┤│     border-bottom のみ
│  │ N   派遣社員 健太       ││     レア度はバッジで表示（badge-gold等）
│  └───────────────────────┘│
│                          │
│ [ ホーム | 閲覧室 | 書架 | 書斎 ] │  ← フッタータブバー
└──────────────────────────┘
```

**チケットカルーセル (`ticket-balance-carousel.tsx`):**
- 各チケットカード: `bg-bg-card border border-white/[0.08] rounded-[16px] p-5`
- 数字: `text-2xl font-bold text-white`
- チケット名: `text-sm text-text-secondary`
- チケット種別の色分け:
  - 無料: `text-text-secondary`（グレー）
  - 銅: `text-amber-600`（銅色）
  - 銀: `text-gray-400`（シルバー）
  - 金: `text-accent`（ゴールド）

### 5.3 ガチャ選択画面（閲覧室） (`/gacha`)

**ファイル:** `src/app/(main)/gacha/page.tsx`

```
┌──────────────────────────┐
│  閲覧室                    │  ← text-2xl font-bold
│  あなたの来世がここに眠っています │ ← text-sm text-text-secondary mt-1
│  ─────────────────────── │
│                          │
│  ┌────────────────────┐   │  ← card-accent（ゴールドボーダー）
│  │                    │   │
│  │  [キャラサムネイル]   │   │  ← 角丸の画像
│  │                    │   │
│  │  健太の物語          │   │  ← text-lg font-bold text-white
│  │  ★★☆☆☆             │   │  ← 星は text-accent（金）と text-text-tertiary（灰）
│  │                    │   │
│  │  [ この本を開く ]     │   │  ← プライマリボタン（幅100%）
│  │  栞 1枚消費           │   │  ← text-xs text-text-tertiary mt-2
│  └────────────────────┘   │
│                          │
│ [ ホーム | 閲覧室 | 書架 | 書斎 ] │
└──────────────────────────┘
```

### 5.4 ガチャプレイヤー (`GachaV4Player`)

**ファイル:** `src/components/gacha/gacha-v4-player.tsx`

ロジックは一切変更しない。変更するのは:

#### 5.4.1 プレイヤーフレーム
```css
background: #0A0A0A;
/* 全画面 Portal — 変更なし */
```

#### 5.4.2 テロップ画像の差し替え (`/public/telop/`)

| 旧ファイル | 新ファイル | テキスト | デザイン |
|---|---|---|---|
| `continue-1.png` ~ `continue-5.png` | `page-1.png` ~ `page-5.png` | 次のページへ | 黒背景に金文字。フォントはInter/Noto Sans太字。5パターン微妙にレイアウト違い |
| `win.png` | `new-chapter.png` | 新章開幕 | 金文字、光のフレア |
| `big-win.png` | `masterpiece.png` | 名著発見 | 大きめ金文字、ゴールドの枠線エフェクト |
| `jackpot.png` | `forbidden-book.png` | 禁断の魔導書 | 金＋虹色に光るテキスト |
| `lose.png` | `blank-page.png` | 白紙の章 | 薄いグレーテキスト、控えめ |
| `chase.png` | `sequel.png` | 続編 — SEQUEL | 金文字で「SEQUEL」、英字メイン |

テロップ画像仕様:
- サイズ: 1080×400px（横長、画面上部に表示）
- 背景: 透過PNG
- フォント: Inter Bold + Noto Sans JP Bold
- テキスト色: `#F5A623`（金）、最高レアは `#FFD700`
- ドロップシャドウ: `0 0 20px rgba(245,166,35,0.5)`

#### 5.4.3 テロップパーティクル (`TelopParticles`)

```
色:     #F5A623 ～ #FFD700 のランダム（ゴールド系）
サイズ:  2px ～ 4px
動き:    下から上にゆっくり上昇
大当たり時: 粒子数2倍 + 白い粒子も混ぜる
```

#### 5.4.4 操作ボタン

```
NEXT ボタン:
  テキスト: 「次のページ ▸」
  スタイル: セカンダリボタン（白ボーダー）
  位置:     画面下部 safe-area 内

SKIP ボタン:
  テキスト: 「読み飛ばす ▸▸」
  スタイル: テキストボタン（text-text-secondary、小さめ）
```

### 5.5 カード結果画面 (`CardReveal`)

```
┌──────────────────────────┐
│                          │
│  物語が完結しました         │  ← text-lg font-bold text-accent
│                          │
│  ┌────────────────────┐   │  ← レア度に応じたボーダー色のカード
│  │                    │   │
│  │  SSR               │   │  ← badge-gold
│  │                    │   │
│  │  [キャラクターイラスト]│   │
│  │                    │   │
│  │  コンビニ王 健太     │   │  ← text-lg font-bold
│  │                    │   │
│  │  No.0042 / 1000    │   │  ← text-sm text-text-tertiary
│  │                    │   │
│  └────────────────────┘   │
│                          │
│  あなたの来世は...         │  ← text-text-secondary
│  「コンビニ10店舗のオーナー」│  ← text-white font-bold
│                          │
│  [書架を見る]  [もう1冊]    │  ← セカンダリ + プライマリボタン
│                          │
└──────────────────────────┘
```

**カード枠（レア度別）:**

| レア度 | ボーダー | バッジ | 特殊効果 |
|---|---|---|---|
| N（★1-2） | `border-white/[0.08]` | `bg-white/[0.08] text-[#666]` | なし |
| R（★3-4） | `border-[#4ADE80]/40` | `bg-[#4ADE80]/15 text-[#4ADE80]` | なし |
| SR（★5-6） | `border-[#60A5FA]/40` | `bg-[#60A5FA]/15 text-[#60A5FA]` | 微かな青い光 |
| SSR（★7-8） | `border-accent/60` | `badge-gold` | ゴールドパーティクル |
| UR（★9-10） | `border-[#C084FC]/60` | `bg-[#C084FC]/15 text-[#C084FC]` | 紫オーラ + パーティクル |
| LR（★11-12） | `border-accent-bright/80` + アニメーション | `bg-accent/20 text-accent-bright` | 全体発光 + 虹色パルス |

**LR カード枠 CSS:**
```css
.card-lr {
  border: 2px solid #FFD700;
  border-radius: 16px;
  animation: lr-glow 2s ease-in-out infinite;
}
@keyframes lr-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.3); }
  50% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.6); }
}
```

### 5.6 書架画面（図鑑/コレクション）

**ファイル:** `src/app/(main)/collection/page.tsx`

```
┌──────────────────────────┐
│  書架                      │  ← text-2xl font-bold
│  12 / 84 冊                │  ← text-sm text-text-secondary
│  ─────────────────────── │
│                          │
│  健太の物語                │  ← text-lg font-bold mt-6
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐   │  ← グリッド表示（4列）
│  │N │ │N │ │R │ │R │   │     各セルは bg-bg-card + レア度ボーダー
│  └──┘ └──┘ └──┘ └──┘   │     取得済みは色付き
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐   │     未取得は bg-bg-card + ？マーク
│  │SR│ │？│ │？│ │SSR│  │     opacity-50
│  └──┘ └──┘ └──┘ └──┘   │
│                          │
│  ??? の物語               │  ← 未解放キャラ
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐   │     全ロック状態、text-text-tertiary
│  │？│ │？│ │？│ │？│   │
│  └──┘ └──┘ └──┘ └──┘   │
│                          │
│ [ ホーム | 閲覧室 | 書架 | 書斎 ] │
└──────────────────────────┘
```

**書架グリッドセル:**
```
取得済み:
  bg-bg-card
  border: 2px solid {レア度カラー} (opacity 40%)
  rounded-[12px]
  padding: 8px
  中央にキャラアイコン小 + レア度バッジ

未取得:
  bg-bg-card
  border: 1px solid rgba(255,255,255,0.08)
  rounded-[12px]
  opacity: 0.4
  中央に ？ (text-text-tertiary text-2xl)
```

### 5.7 書斎画面（マイページ）

**ファイル:** `src/app/(main)/mypage/page.tsx`

```
┌──────────────────────────┐
│  書斎                      │  ← text-2xl font-bold
│  ─────────────────────── │
│                          │
│  ┌───────────────────────┐│  ← bg-bg-card + border
│  │  👤 ユーザー名          ││
│  │  email@example.com     ││  ← text-text-secondary
│  └───────────────────────┘│
│                          │
│  ┌───────────────────────┐│  ← メニューリスト
│  │ 📜 物語の記録     ▸    ││     bg-bg-card
│  ├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤│     各行の間は border-white/[0.05]
│  │ 🔖 栞の管理       ▸    ││     矢印は text-text-tertiary
│  ├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤│
│  │ 💌 招待状         ▸    ││
│  ├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤│
│  │ 💬 LINE連携       ▸    ││
│  └───────────────────────┘│
│                          │
│ [ ホーム | 閲覧室 | 書架 | 書斎 ] │
└──────────────────────────┘
```

### 5.8 フッタータブバー

**ファイル:** `src/components/layout/tab-bar.tsx`

```css
.tab-bar {
  background: #0A0A0A;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 8px 0;
  padding-bottom: env(safe-area-inset-bottom);
}

.tab-item {
  color: #666666;       /* 非アクティブ */
  font-size: 11px;
  font-weight: 500;
}
.tab-item.active {
  color: #F5A623;       /* アクティブ: ゴールド */
}
```

| タブ | テキスト | アイコン |
|---|---|---|
| 1 | ホーム | 🏠 (HouseアイコンSVG) |
| 2 | 閲覧室 | 📖 (BookOpenアイコンSVG) |
| 3 | 書架 | 📚 (LibraryアイコンSVG) |
| 4 | 書斎 | 👤 (UserアイコンSVG) |

アイコンは Lucide Icons または Heroicons を使用（アウトラインスタイル）。

### 5.9 認証画面 (`/login`, `/register`)

```
背景: #0A0A0A

中央に認証カード:
  bg-bg-card
  border border-white/[0.08]
  rounded-[16px]
  p-8
  max-w-sm mx-auto

タイトル: text-xl font-bold text-white
  ログイン: 「書庫への入館」
  登録:     「入館証の発行」

入力欄: .input スタイル（上記3.4参照）
ボタン: プライマリボタン（幅100%）
リンク: text-accent text-sm
  「入館証をお持ちでない方 →」
  「入館証をお持ちの方 →」
```

### 5.10 管理者パネル (`/admin`)

最小限の変更:
- サイドバー背景: `#111111`
- アクセント: `#F5A623`
- タイトル: 「来世ガチャ管理」
- ラベル変更:
  - 「ストーリー管理」→「物語管理」
  - 「どんでん設定」→「隠された章 設定」
  - 「追撃設定」→「続編設定」

---

## 6. レスポンシブ

```
モバイル（< 640px）:   1カラム、幅100%、px-4
タブレット（640-1024px）: 中央寄せ max-w-lg、px-6
デスクトップ（> 1024px）: 中央寄せ max-w-md
```

ガチャプレイヤーは全画面 Portal（レスポンシブ不要）。

---

## 7. アセット一覧（要作成/差替）

### 7.1 アイコン類

| ファイル | 内容 | 備考 |
|---|---|---|
| `/public/icon.png` | 本のアイコン（シンプル、ゴールド線） | 512×512 |
| `/public/icon-large.png` | ロゴ | 1024×1024 |
| `/public/apple-touch-icon.png` | iOS用 | 180×180 |
| `/public/favicon.ico` | ファビコン | 32×32 |

### 7.2 テロップ画像（10枚差替）

※ セクション5.4.2参照

### 7.3 栞（チケット）イラスト

| 旧ファイル | 新ファイル | デザイン |
|---|---|---|
| `ticket-illustration.svg` | `bookmark-free.svg` | シンプルな栞、グレーライン |
| `ticket-illustration-basic.svg` | `bookmark-bronze.svg` | 銅色の栞 |
| `ticket-illustration-premium.svg` | `bookmark-silver.svg` | 銀色の栞 |
| `ticket-illustration-epic.svg` | `bookmark-gold.svg` | ゴールドの栞 |
| `ticket-illustration-vip.svg` | `bookmark-platinum.svg` | プラチナの栞 |

栞デザイン: シンプルなアウトラインSVG。Tria風のクリーンさを維持。

---

## 8. やってはいけないこと（Tria風を維持するために）

1. **グラデーション背景を使わない** — 背景はフラットな `#0A0A0A`
2. **影（box-shadow）を多用しない** — 立体感はボーダーの色差で出す
3. **テキストに装飾フォント（セリフ体）を使わない** — すべてゴシック（Inter / Noto Sans JP）
4. **彩度の高い色を広範囲に使わない** — ゴールドはアクセントのみ。面で使わない
5. **要素を詰め込みすぎない** — 余白をたっぷり取る（padding 20px以上）
6. **純白 `#FFFFFF` を本文テキストに使わない** — `#E5E5E5` を使う
7. **装飾的な罫線（✦、═══ 等）を使わない** — シンプルな 1px 線のみ
8. **角丸を小さくしない** — カード 16px、ボタン 12px を維持

---

## 9. 実装チェックリスト

### Phase 1: 基盤（最優先）
- [ ] Tailwind config にカラーパレット追加（セクション2.2）
- [ ] Google Fonts（Inter + Noto Sans JP）読み込み
- [ ] `body` / ルートレイアウトに `bg-[#0A0A0A] text-[#E5E5E5]` 適用
- [ ] 共通カードコンポーネント作成（通常 / accent / highlight）
- [ ] 共通ボタンコンポーネント作成（primary / secondary / text）
- [ ] 共通バッジコンポーネント作成（gold / green / gray）
- [ ] 共通入力フォームスタイル
- [ ] 区切り線スタイル

### Phase 2: 画面別 UI
- [ ] スプラッシュ画面リデザイン
- [ ] フッタータブバー変更（テキスト + アイコン + 色）
- [ ] ホーム画面リデザイン（ログインボーナス + カルーセル + CTA）
- [ ] ガチャ選択画面（閲覧室）リデザイン
- [ ] 書架画面（図鑑）リデザイン
- [ ] 書斎画面（マイページ）リデザイン
- [ ] 認証画面リデザイン

### Phase 3: ガチャ体験
- [ ] テロップ画像差替（仮テキスト画像でOK）
- [ ] TelopParticles の色変更（ゴールド系）
- [ ] 操作ボタン変更（テキスト + スタイル）
- [ ] カード結果画面のレア度別デザイン
- [ ] LR カードの発光アニメーション

### Phase 4: 仕上げ
- [ ] 全テキスト置換の最終確認（用語マッピング表）
- [ ] 管理者パネルの最小テーマ変更
- [ ] OGP / メタタグ更新
- [ ] PWA アイコン差替
- [ ] パフォーマンス確認（不要な背景エフェクトがないこと）

---

## 10. 注意事項

1. **ロジックに触らない**: ガチャエンジン、API、DBは一切変更しない
2. **Tria風を忠実に**: 迷ったらTriaのスクショを見返す。「黒なのに暗くない」がキーワード
3. **余白を惜しまない**: 要素間のスペースはTriaと同じかそれ以上
4. **テロップ画像は仮置きOK**: 後から差替え可能な設計にする
5. **Phase順に進める**: 基盤→画面→ガチャ→仕上げ
