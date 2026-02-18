# リファラルページエラーの修正手順

## 問題の概要

`/referrals` ページにアクセスすると、以下のエラーが発生します：
```
Application error: a server-side exception has occurred while loading raisegacha.com
Digest: 1025026886
```

## 原因

データベースの `referral_claims` テーブルに必要なカラム（`referrer_reward_tickets`, `referee_reward_tickets`）が存在しない可能性があります。これは、マイグレーション `20260219_referral_program.sql` が正しく実行されていない場合に発生します。

## 修正手順

### 1. データベーススキーマの確認

まず、現在のスキーマが正しいか確認します：

```bash
npm run tsx scripts/check-referral-schema.ts
```

または

```bash
tsx scripts/check-referral-schema.ts
```

このスクリプトは以下を確認します：
- `referral_claims` テーブルの存在と必要なカラム
- `referral_codes` テーブルの存在
- `referral_settings` テーブルの存在とグローバル設定
- `friends` テーブルの存在
- `app_users` テーブルのリファラル関連カラム

### 2. マイグレーションの実行（必要な場合）

スキーマ確認でエラーが見つかった場合、以下のいずれかを実行してください：

#### オプションA: 特定のマイグレーションを実行

Supabase SQL Editorで以下のマイグレーションを実行：

```
supabase/migrations/20260219_referral_program.sql
```

#### オプションB: 完全なスキーマを再構築

Supabase SQL Editorで以下を実行：

```
supabase/migrations/00_complete_schema.sql
```

**注意**: この方法は既存のデータを保持しますが、念のためバックアップを取ることを推奨します。

### 3. 修正内容の確認

以下の修正がコードに適用されています：

1. **エラーハンドリングの改善** (`src/app/(main)/referrals/page.tsx`)
   - try-catch ブロックでページ全体をラップ
   - 詳細なエラーメッセージを表示
   - ユーザーフレンドリーなエラーページ

2. **デバッグログの追加** (`src/lib/data/referrals.ts`)
   - `fetchReferralStats` 関数にエラーログを追加
   - より詳細なエラーメッセージ

3. **スキーマ検証スクリプト** (`scripts/check-referral-schema.ts`)
   - データベーススキーマを自動確認
   - 問題を早期発見

## 動作確認

修正後、以下の手順で動作を確認してください：

1. ブラウザで `/referrals` ページにアクセス
2. エラーが表示される場合、ブラウザの開発者ツールでコンソールログを確認
3. サーバーログ（Next.js ターミナル）でエラーメッセージを確認

## トラブルシューティング

### エラーメッセージの確認方法

**ブラウザコンソール**:
- Chrome/Edge: F12 → Console タブ
- Firefox: F12 → コンソール タブ

**サーバーログ**:
- `npm run dev` を実行しているターミナルを確認

### よくあるエラーと解決策

#### 1. "column referrer_reward_tickets does not exist"

**原因**: マイグレーションが実行されていない

**解決**: マイグレーション `20260219_referral_program.sql` を実行

#### 2. "relation referral_claims does not exist"

**原因**: テーブル自体が存在しない

**解決**: 完全なスキーマ `00_complete_schema.sql` を実行

#### 3. "Failed to fetch referral stats"

**原因**: データベース接続の問題または権限の問題

**解決**: 
- `.env.local` ファイルの `SUPABASE_SERVICE_ROLE_KEY` が正しいか確認
- Supabase ダッシュボードでサービスロールキーを再生成

## 予防策

今後同様の問題を防ぐために：

1. **デプロイ前にスキーマ確認**: `npm run tsx scripts/check-referral-schema.ts`
2. **マイグレーションの順次実行**: 日付順にすべてのマイグレーションを実行
3. **ステージング環境でテスト**: 本番環境にデプロイする前に確認

## サポート

この手順で解決しない場合は、以下の情報を添えてサポートにお問い合わせください：

- エラーメッセージ全文（ブラウザコンソール + サーバーログ）
- スキーマ確認スクリプトの出力結果
- 実行したマイグレーションのリスト
