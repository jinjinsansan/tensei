# 昭一キャラクターが出ない問題の原因と修正方法

## 🔴 問題の原因

1. **データベース初期値で昭一が無効化されている**
   - `supabase/migrations/20260216_multi_character_v2.sql` の33行目
   - `('shoichi', '昭一', false, 40)` で `is_active = false` になっている
   
2. **管理画面のエラー表示がない**
   - Server Actionがエラーを返しても、ユーザーに表示されない
   - 保存ボタンが押せない原因が分からない

## ✅ 即座に修正する方法

### 方法1: Supabase SQL Editorで直接修正（推奨・最速）

以下のSQLを実行：

```sql
-- 昭一を有効化
UPDATE gacha_characters
SET is_active = true, updated_at = now()
WHERE character_id = 'shoichi';

-- 確認
SELECT character_id, character_name, is_active, weight
FROM gacha_characters
ORDER BY character_id;
```

### 方法2: 管理画面のコード修正

管理画面にエラー表示機能を追加し、保存できない理由をユーザーに伝える。

## 🔍 詳細診断

### 現在のデータベース状態を確認するSQL

```sql
-- gacha_characters テーブルの内容
SELECT * FROM gacha_characters ORDER BY character_id;

-- gacha_rtp_config テーブルの内容
SELECT * FROM gacha_rtp_config ORDER BY character_id;

-- gacha_global_config テーブルの内容
SELECT * FROM gacha_global_config;
```

### キャラクター抽選ロジックの確認ポイント

1. `activeCharacters = gachaCharacters.filter((c) => c.isActive && c.weight > 0)`
   - `is_active = false` のキャラクターは除外される
   - `weight = 0` のキャラクターも除外される

2. `pickByWeight(activeCharacters)`
   - 有効なキャラクターの中から weight に基づいて抽選

## 📋 修正後の確認手順

1. SQLで昭一を有効化
2. ブラウザで管理画面 `/admin/character-rtp` を開く
3. 昭一の「ガチャ対象に含める」がチェックされていることを確認
4. ガチャを数回実行して昭一が出ることを確認

## 🚨 根本的な修正（次回デプロイ時）

1. マイグレーションSQLの初期値を修正
2. 管理画面にエラー表示UIを追加
