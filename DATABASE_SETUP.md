# データベースセットアップ

## 問題: "ガチャの生成に失敗しました" エラー

このエラーは、Supabase に必要なテーブルが存在しないために発生しています。

## 解決方法

### 1. Supabase SQL Editor でマイグレーションを実行

1. [Supabase Dashboard](https://app.supabase.com) にアクセス
2. プロジェクトを選択
3. 左メニューから **SQL Editor** を開く
4. **New Query** をクリック
5. `supabase/migrations/00_complete_schema.sql` の内容を全てコピー&ペースト
6. **Run** をクリックして実行

### 2. ガチャデータの同期

マイグレーション実行後、以下のコマンドでキャラクター・カード・シナリオデータを同期します：

```bash
npm run sync:gacha-data
```

### 3. 確認

ガチャページにアクセスして、"ガチャを始める" ボタンをクリックし、エラーが発生しないことを確認してください。

## データベース構造

主要なテーブル：

- **characters**: キャラクター情報
- **cards**: カード情報（各キャラクターに紐付け）
- **pre_stories**: 転生前シーン
- **chance_scenes**: チャンスシーン  
- **scenarios**: メインストーリー・どんでん返しシーン
- **gacha_config**: ガチャ設定（RTP、どんでん返し率など）
- **gacha_results**: ガチャ結果履歴
- **user_tickets**: ユーザーのチケット残高
- **app_users**: アプリユーザー（認証済み）

## トラブルシューティング

### エラー: "Could not find the table 'public.characters'"

→ 上記のマイグレーション手順を実行してください。

### エラー: "No active characters configured"

→ `npm run sync:gacha-data` を実行してキャラクターデータを同期してください。

### エラー: "Character 健太 has no active cards"

→ `npm run sync:gacha-data` を実行してカードデータを同期してください。データが正しく同期されない場合は、`src/lib/gacha/characters/kenta/` 配下のファイルを確認してください。
