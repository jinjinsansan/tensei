# 管理画面の保存ボタンが押せない問題のデバッグ方法

## 確認手順

### 1. ブラウザの開発者ツールを開く
1. Chrome/Edge: `F12` または `Ctrl+Shift+I`
2. Console タブを開く

### 2. ボタンをクリックして以下を確認

#### A. Console タブ
エラーメッセージが表示されているか？
- 赤色のエラーメッセージ
- `Uncaught Error`
- `Failed to fetch`

#### B. Network タブ
1. Network タブを開く
2. 保存ボタンをクリック
3. リクエストが送信されているか確認
   - リクエスト名: `/admin/character-rtp` または類似
   - Method: `POST`
   - Status: `200` または `307` (redirect)

#### C. Elements タブ
ボタン要素を検査：
```html
<button type="submit" class="...">
  このキャラクターの設定を保存
</button>
```

確認ポイント：
- `disabled` 属性がないか
- `pointer-events: none` が適用されていないか
- ボタンが別の要素に覆われていないか (z-index)

### 3. 考えられる原因と対処法

#### 原因1: JavaScriptエラー
**症状**: Consoleにエラーメッセージが表示される
**対処**: エラーメッセージを報告してください

#### 原因2: フォーム送信がブロックされている
**症状**: Networkタブにリクエストが表示されない
**対処**: 
- ページを再読み込み (`Ctrl+R`)
- キャッシュクリア後に再読み込み (`Ctrl+Shift+R`)
- シークレットウィンドウで試す

#### 原因3: Server Actionのエラー
**症状**: Networkタブで `500` エラー
**対処**: サーバーログを確認（Vercelダッシュボード）

#### 原因4: RTP合計が100%でない
**症状**: 何も起きない、またはページがリロードされない
**対処**: 
- N + R + SR + SSR + UR + LR = 100% になっているか確認
- 例: N=35, R=25, SR=20, SSR=12, UR=6, LR=2 → 合計100%

#### 原因5: ブラウザのJavaScript無効化
**症状**: ボタンが全く反応しない
**対処**: ブラウザ設定でJavaScriptが有効か確認

### 4. 手動テスト用SQL

管理画面を使わず、直接SQLで設定を変更：

```sql
-- 健太の設定を変更
UPDATE gacha_characters
SET is_active = true, weight = 50, updated_at = now()
WHERE character_id = 'kenta';

UPDATE gacha_rtp_config
SET 
  rarity_n = 35,
  rarity_r = 25,
  rarity_sr = 20,
  rarity_ssr = 12,
  rarity_ur = 6,
  rarity_lr = 2,
  donden_rate = 15,
  updated_at = now()
WHERE character_id = 'kenta';

-- 昭一の設定を変更
UPDATE gacha_characters
SET is_active = true, weight = 50, updated_at = now()
WHERE character_id = 'shoichi';

UPDATE gacha_rtp_config
SET 
  rarity_n = 35,
  rarity_r = 25,
  rarity_sr = 20,
  rarity_ssr = 12,
  rarity_ur = 6,
  rarity_lr = 2,
  donden_rate = 15,
  updated_at = now()
WHERE character_id = 'shoichi';
```

### 5. デバッグ情報の収集

以下の情報を教えてください：
1. ブラウザの種類とバージョン (Chrome 120, Safari 17, など)
2. Console タブのエラーメッセージ（あれば）
3. ボタンをクリックしたときの挙動
   - 何も起きない
   - ページが一瞬白くなる
   - ローディング表示が出る
   - エラーメッセージが表示される
4. Network タブでリクエストが送信されているか
