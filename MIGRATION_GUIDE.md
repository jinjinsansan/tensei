# 🚨 重要: データベースマイグレーション実行手順

## ❌ 現在のエラー

```
Could not find the table 'public.characters' in the schema cache
```

このエラーは、Supabase にテーブルが存在しないために発生しています。

## ✅ 解決方法（手順を順番に実行してください）

### ステップ 1: Supabase SQL Editor を開く

1. ブラウザで https://app.supabase.com を開く
2. プロジェクト `syevxpsflyhyychxjlpl` を選択
3. 左メニューから **SQL Editor** をクリック

### ステップ 2: マイグレーション SQL を実行

1. **New Query** ボタンをクリック
2. 以下のファイルを開く:
   ```
   supabase/migrations/00_complete_schema.sql
   ```
3. ファイルの**全内容**をコピー
4. SQL Editor にペースト
5. **Run** ボタン（または Ctrl+Enter / Cmd+Enter）をクリック
6. 成功メッセージが表示されるまで待つ

### ステップ 3: ガチャデータを同期

ターミナルで以下のコマンドを実行:

```bash
npm run sync:gacha-data
```

✅ 成功すると、以下のようなメッセージが表示されます:
```
Successfully synced characters, cards, and scenarios to Supabase.
```

### ステップ 4: 動作確認

1. ブラウザで https://raisegacha.com/gacha を開く
2. 「ガチャを始める」ボタンをクリック
3. ガチャ演出が正常に再生されることを確認

## 🔍 トラブルシューティング

### エラー: "relation already exists"

→ 一部のテーブルは既に存在しています。無視して構いません。`create table if not exists` を使用しているため、既存のテーブルは上書きされません。

### エラー: "No active characters configured"

→ ステップ 3 の `npm run sync:gacha-data` を実行してください。

### エラー: "permission denied"

→ Supabase で Service Role Key が正しく設定されているか確認してください（`.env.local` ファイル）。

### sync-gacha-data が失敗する

1. Supabase Dashboard で **Table Editor** を開く
2. `characters` テーブルが存在するか確認
3. 存在しない場合は、ステップ 2 のマイグレーションが正しく実行されていません

## 📊 作成されるテーブル一覧

- ✅ `user_sessions` - ユーザーセッション
- ✅ `app_users` - 認証済みユーザー
- ✅ `characters` - キャラクター情報
- ✅ `cards` - カード情報
- ✅ `pre_stories` - 転生前シーン
- ✅ `chance_scenes` - チャンスシーン
- ✅ `scenarios` - メイン・どんでん返しシーン
- ✅ `gacha_config` - ガチャ設定
- ✅ `gacha_results` - ガチャ結果
- ✅ `gacha_history` - ガチャ履歴
- ✅ `ticket_types` - チケット種別
- ✅ `user_tickets` - ユーザーチケット残高
- ✅ `card_collection` - カードコレクション
- ✅ `card_inventory` - カード所有履歴
- ✅ `rtp_settings` - RTP設定
- ✅ `donden_rate_settings` - どんでん返し率
- ✅ `tsuigeki_settings` - 追撃設定

## 💡 ヒント

- マイグレーションは **一度だけ** 実行すれば OK です
- データ同期（`npm run sync:gacha-data`）は、キャラクター・カード・シナリオを更新するたびに実行できます
- Supabase の Table Editor で、テーブルが正しく作成されたか確認できます
