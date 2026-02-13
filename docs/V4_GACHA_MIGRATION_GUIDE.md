# V4ガチャシステム移植ガイド

## 📌 概要

このドキュメントは、動画アセットが準備できた際に、尊師プロジェクトのV4ガチャシステム（全画面動画演出）を来世ガチャに移植するための完全ガイドです。

**作成日**: 2026-02-13  
**最終更新**: 2026-02-13  
**参照元**: `/mnt/e/dev/Cusor/sonshi/sonshigacha/`

---

## 🔍 現状と目標

### 現状（来世ガチャ）
- **コンポーネント**: `GachaNeonPlayer` + `GachaExperience`
- **表示方式**: モーダル内で簡易表示
- **動画**: なし（動画アセット未準備）
- **データベース**: 既存スキーマを使用

### 目標（V4移植後）
- **コンポーネント**: `GachaV4Player`（尊師プロジェクトから移植）
- **表示方式**: 全画面で動画再生
- **動画**: R2バケットまたはローカルから配信
- **演出**: テロップ、パーティクルエフェクト付き
- **データベース**: V4専用テーブル追加

---

## 📋 必要な動画アセット

### 動画ファイル形式
- **フォーマット**: MP4 (H.264)
- **解像度**: 1080p または 720p
- **アスペクト比**: 9:16 (縦長スマホ向け) または 16:9
- **ビットレート**: 2-5 Mbps 推奨

### 動画カテゴリ

#### 1. スタンバイ動画 (Standby)
- **ID例**: S01, S02, S03, S04, S05, S06
- **説明**: ガチャ開始前の待機画面
- **星レベル別**: 高星レベルほど豪華な演出

#### 2. カウントダウン動画 (Countdown)
- **ID例**: C01, C02, C03, C04, C05, C06
- **説明**: ガチャ開始のカウントダウン
- **星レベル別**: 高星レベルほど派手な演出

#### 3. ストーリー動画
- **オープニング (Opening)**: OP01, OP02...
- **ミス (Miss)**: MS01, MS02...
- **ヘルプ (Help)**: HP01, HP02...
- **トラブル (Trouble)**: TB01, TB02...
- **回復 (Recovery)**: RC01, RC02...
- **リアクション (Reaction)**: RT01, RT02...
- **判定 (Judge)**: JD01, JD02...
- **追撃 (Chase)**: CH01, CH02...

### 動画配置場所

**Option A: ローカル配置（開発・テスト用）**
```
/public/videos/
  ├── S01.mp4
  ├── S02.mp4
  ├── C01.mp4
  ├── OP01.mp4
  └── ...
```

**Option B: R2バケット（本番環境推奨）**
- Cloudflare R2 バケットにアップロード
- 環境変数 `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` に公開URLを設定

---

## 🗄️ データベースマイグレーション

### 1. V4動画管理テーブル

```sql
-- story_videos テーブル
CREATE TABLE IF NOT EXISTS story_videos (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  filename TEXT NOT NULL,
  duration_seconds NUMERIC DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 初期データ投入例
INSERT INTO story_videos (id, category, filename, duration_seconds) VALUES
  ('S01', 'opening', 'S01.mp4', 3),
  ('S02', 'opening', 'S02.mp4', 3),
  ('C01', 'countdown', 'C01.mp4', 5),
  ('OP01', 'opening', 'OP01.mp4', 8),
  ('MS01', 'miss', 'MS01.mp4', 6);
```

### 2. V4シナリオテーブル

```sql
-- story_scenarios テーブル
CREATE TABLE IF NOT EXISTS story_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  star_rating INTEGER NOT NULL,
  result TEXT NOT NULL, -- 'lose', 'small_win', 'win', 'big_win', 'jackpot'
  video_sequence TEXT[] NOT NULL,
  has_chase BOOLEAN DEFAULT FALSE,
  chase_result TEXT, -- 'success' or 'fail'
  is_donden BOOLEAN DEFAULT FALSE,
  weight INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- シナリオ例
INSERT INTO story_scenarios (name, star_rating, result, video_sequence, has_chase) VALUES
  ('基本勝利シナリオ', 5, 'win', ARRAY['OP01', 'MS01', 'HP01', 'JD01'], FALSE),
  ('追撃チャンスシナリオ', 10, 'big_win', ARRAY['OP01', 'TB01', 'CH01'], TRUE);
```

### 3. RTP設定拡張

```sql
-- rtp_settings テーブルにカラム追加（既存テーブルがある場合）
ALTER TABLE rtp_settings ADD COLUMN IF NOT EXISTS min_koma INTEGER DEFAULT 3;
ALTER TABLE rtp_settings ADD COLUMN IF NOT EXISTS max_koma INTEGER DEFAULT 8;
```

---

## 📦 移植するファイル一覧

### コピー元（尊師プロジェクト）
`/mnt/e/dev/Cusor/sonshi/sonshigacha/src/`

### 1. 型定義

```bash
# V3型定義（V4の基礎）
src/lib/gacha/v3/types.ts
src/lib/gacha/v3/utils.ts
src/lib/gacha/v3/selectors.ts
src/lib/gacha/v3/generator.ts
src/lib/gacha/v3/data.ts

# V4型定義
src/lib/gacha/v4/types.ts
src/lib/gacha/v4/generator.ts
src/lib/gacha/v4/data.ts
```

### 2. コンポーネント

```bash
# V4プレイヤー（メインコンポーネント）
src/components/gacha/gacha-v4-player.tsx
```

### 3. APIエンドポイント

```bash
# V4ガチャAPI
src/app/api/gacha/v4/play/route.ts
src/app/api/gacha/v4/result/route.ts
```

### 4. 必要な修正

コピー後、以下を修正：

#### `src/lib/gacha/v3/data.ts` & `src/lib/gacha/v4/data.ts`
```typescript
// 修正前
import { getSupabaseServiceClient } from "@/lib/supabase/service";

// 修正後
import { getServiceSupabase } from "@/lib/supabase/service";

// 関数呼び出しも変更
const supabase = getServiceSupabase();
```

#### `src/lib/gacha/v3/utils.ts`
```typescript
// 修正前
import { publicEnv } from "@/lib/env";
const base = publicEnv.NEXT_PUBLIC_R2_PUBLIC_BASE_URL;

// 修正後
const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL;
```

#### `src/app/api/gacha/v4/play/route.ts`
```typescript
// 認証を来世ガチャの方式に変更
import { getServiceSupabase } from "@/lib/supabase/service";
import { fetchAuthedContext } from "@/lib/app/session";

export async function POST() {
  const supabase = getServiceSupabase();
  const context = await fetchAuthedContext(supabase);
  
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { user } = context;
  // ...
}
```

#### `src/app/api/gacha/v4/result/route.ts`
```typescript
// gacha_results のカラム名を来世ガチャ用に調整
const insertPayload = picked.map((card) => ({
  app_user_id: user.id,
  history_id: historyRow.id,
  card_id: card.id,
  obtained_via: "gacha_v4",
  star_level: card.star,
  had_reversal: false,
  scenario_snapshot: {},
  card_awarded: true,
  metadata: {},
  created_at: new Date().toISOString(),
}));

// 型エラー回避のため any アサーション
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { data: insertedResults, error: insertErr } = await supabase
  .from("gacha_results")
  .insert(insertPayload as any)
  .select("id, card_id");
```

---

## 🔧 ガチャページの更新

### `src/app/(main)/gacha/page.tsx`

```typescript
// 修正前
import { GachaNeonPlayer } from "@/components/gacha/gacha-neon-player";

// 修正後
import { GachaV4Player } from "@/components/gacha/gacha-v4-player";

// ボタン部分
<GachaV4Player playVariant="round" playLabel="ガチャを始める" />
```

---

## ⚙️ 環境変数設定

### `.env.local` に追加

```bash
# R2バケット公開URL（本番環境）
NEXT_PUBLIC_R2_PUBLIC_BASE_URL=https://your-bucket.r2.cloudflarestorage.com

# ローカル開発の場合は不要（自動的に /public/videos/ を使用）
```

---

## 🚀 実装手順

### ステップ1: データベース準備
```bash
# Supabaseダッシュボードで新しいマイグレーションを作成
# または
npx supabase migration new add_v4_gacha_tables

# 上記SQLを実行
```

### ステップ2: ファイルコピー
```bash
cd /mnt/e/dev/Cusor/tensei

# ディレクトリ作成
mkdir -p src/lib/gacha/v3 src/lib/gacha/v4

# V3ファイルをコピー
cp /mnt/e/dev/Cusor/sonshi/sonshigacha/src/lib/gacha/v3/*.ts src/lib/gacha/v3/

# V4ファイルをコピー
cp /mnt/e/dev/Cusor/sonshi/sonshigacha/src/lib/gacha/v4/*.ts src/lib/gacha/v4/

# コンポーネントをコピー
cp /mnt/e/dev/Cusor/sonshi/sonshigacha/src/components/gacha/gacha-v4-player.tsx src/components/gacha/

# APIエンドポイントをコピー
mkdir -p src/app/api/gacha/v4/play src/app/api/gacha/v4/result
cp /mnt/e/dev/Cusor/sonshi/sonshigacha/src/app/api/gacha/v4/play/route.ts src/app/api/gacha/v4/play/
cp /mnt/e/dev/Cusor/sonshi/sonshigacha/src/app/api/gacha/v4/result/route.ts src/app/api/gacha/v4/result/
```

### ステップ3: 修正適用
```bash
# getSupabaseServiceClient を getServiceSupabase に置換
sed -i 's/getSupabaseServiceClient/getServiceSupabase/g' src/lib/gacha/v3/data.ts src/lib/gacha/v4/data.ts

# その他の修正を手動で実施（上記「必要な修正」参照）
```

### ステップ4: ガチャページ更新
```bash
# src/app/(main)/gacha/page.tsx を編集
# GachaNeonPlayer → GachaV4Player に変更
```

### ステップ5: 動画配置
```bash
# ローカル開発の場合
mkdir -p public/videos
# 動画ファイルを public/videos/ に配置

# 本番環境の場合
# R2バケットに動画をアップロードして環境変数を設定
```

### ステップ6: ビルド確認
```bash
npm run lint
npm run build

# エラーがある場合は型定義を調整
```

### ステップ7: 動作確認
```bash
npm run dev
# http://localhost:3000/gacha にアクセス
# 「ガチャを始める」ボタンをクリックして全画面動画演出を確認
```

---

## 🎨 カスタマイズポイント

### 1. テロップ画像
- `/public/telop/` に以下の画像を配置:
  - `continue-1.png` ~ `continue-5.png`
  - `win.png`
  - `big-win.png`
  - `jackpot.png`
  - `lose.png`
  - `chase.png`

### 2. パーティクルエフェクト
- `gacha-v4-player.tsx` の `getParticlePreset()` 関数で調整
- 色、数、重力、ブレンドモードをカスタマイズ可能

### 3. シナリオ設計
- `story_scenarios` テーブルで独自のストーリー展開を設計
- `video_sequence` 配列で動画の再生順序を制御
- `weight` で出現確率を調整

---

## ⚠️ 注意事項

### データベーススキーマの違い
- 尊師ガチャと来世ガチャではテーブル構造が異なります
- `gacha_results` テーブルのカラム名が異なる場合があります
- 必要に応じて型アサーション (`as any`) を使用してください

### チケット消費
- `FREE_PLAY_EMAILS` 配列に開発用メールアドレスを追加すると、チケット消費なしでテスト可能

### 動画ファイルサイズ
- 大きすぎる動画は読み込みが遅くなります
- 5MB以下/ファイル を推奨
- 必要に応じて圧縮してください

---

## 📚 参考リソース

- **尊師プロジェクト**: `/mnt/e/dev/Cusor/sonshi/sonshigacha/`
- **V4プレイヤーコンポーネント**: `sonshigacha/src/components/gacha/gacha-v4-player.tsx`
- **V4ジェネレーター**: `sonshigacha/src/lib/gacha/v4/generator.ts`
- **尊師のデータベース**: Supabase ダッシュボード（尊師ガチャプロジェクト）

---

## ✅ 完了チェックリスト

実装完了時に確認:

- [ ] データベースマイグレーション完了
- [ ] V3/V4型定義ファイル配置完了
- [ ] GachaV4Playerコンポーネント配置完了
- [ ] V4 APIエンドポイント実装完了
- [ ] 関数名・カラム名の修正完了
- [ ] ガチャページ更新完了
- [ ] 動画ファイル配置完了
- [ ] 環境変数設定完了
- [ ] `npm run lint` 成功
- [ ] `npm run build` 成功
- [ ] 動作確認（全画面動画再生）完了
- [ ] テロップ表示確認完了
- [ ] パーティクルエフェクト確認完了
- [ ] カード獲得処理確認完了

---

**作成者**: Droid  
**最終更新日**: 2026-02-13
