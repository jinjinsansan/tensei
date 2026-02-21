# Cloudflare CDN 最適化設定ガイド

## 概要
R2からの動画配信を高速化し、大量アクセス時の負荷を軽減するためのCloudflare CDN設定手順です。

---

## 手順1: R2バケットにカスタムドメインを設定

### 1-1. Cloudflare R2ダッシュボードにアクセス
https://dash.cloudflare.com/ にログイン

### 1-2. R2バケット設定画面を開く
1. 左メニューから **R2** をクリック
2. バケット一覧から `sonshi` を選択
3. **Settings** タブをクリック

### 1-3. カスタムドメインを追加
1. **Custom Domains** セクションで **Connect Domain** をクリック
2. ドメイン名を入力:
   ```
   cdn.raisegacha.com
   ```
   または
   ```
   videos.raisegacha.com
   ```
3. **Continue** をクリック
4. DNS レコードが自動的に追加されることを確認
5. **Activate Domain** をクリック

---

## 手順2: Cache Rulesを設定

### 2-1. Cloudflare Dashboard で Caching 設定を開く
1. 左メニューから **Caching** → **Cache Rules** をクリック
2. **Create Rule** をクリック

### 2-2. ルールを作成
**Rule Name:**
```
R2 Video Cache
```

**When incoming requests match:**
- Field: `Hostname`
- Operator: `equals`
- Value: `cdn.raisegacha.com` (手順1で設定したドメイン)

**AND**

- Field: `URI Path`
- Operator: `starts with`
- Value: `/videos/`

**Then:**
- **Eligible for cache**: `Yes`
- **Edge Cache TTL**: `1 month` (2592000秒)
- **Browser Cache TTL**: `1 week` (604800秒)

### 2-3. 保存
**Deploy** をクリック

---

## 手順3: .env.local を更新

### 現在の設定:
```env
NEXT_PUBLIC_GACHA_ASSET_BASE_URL=https://pub-9a2c1b6d396d4cb7a8551782bab03a06.r2.dev/videos
```

### 更新後:
```env
NEXT_PUBLIC_GACHA_ASSET_BASE_URL=https://cdn.raisegacha.com/videos
```

または

```env
NEXT_PUBLIC_GACHA_ASSET_BASE_URL=https://videos.raisegacha.com/videos
```

---

## 手順4: Vercel環境変数を更新

### 4-1. Vercel Dashboardにアクセス
https://vercel.com/dashboard

### 4-2. プロジェクト設定を開く
1. `tensei` プロジェクトを選択
2. **Settings** → **Environment Variables** をクリック

### 4-3. 環境変数を更新
1. `NEXT_PUBLIC_GACHA_ASSET_BASE_URL` を検索
2. **Edit** をクリック
3. 値を更新:
   ```
   https://cdn.raisegacha.com/videos
   ```
4. **Save** をクリック

### 4-4. 再デプロイ
1. **Deployments** タブへ移動
2. 最新のデプロイの右側メニュー（...）をクリック
3. **Redeploy** をクリック

---

## 動作確認

### 確認1: DNS解決
```bash
dig cdn.raisegacha.com
```
Cloudflare のIPアドレス（104.x.x.x など）が返ってくることを確認

### 確認2: CDNヘッダー確認
```bash
curl -I https://cdn.raisegacha.com/videos/common/puchun/puchun.mp4
```

以下のヘッダーが含まれていることを確認:
```
CF-Cache-Status: HIT  (2回目以降のアクセスで表示)
CF-RAY: xxxxx-NRT
Cache-Control: public, max-age=604800
```

### 確認3: 実際のガチャで動作確認
1. ブラウザの開発者ツール（Network タブ）を開く
2. ガチャを実行
3. 動画リクエストのURLが `cdn.raisegacha.com` になっていることを確認
4. レスポンスヘッダーに `CF-Cache-Status: HIT` が含まれることを確認（2回目以降）

---

## 期待される効果

### パフォーマンス改善
- 初回アクセス: R2から直接配信（変化なし）
- 2回目以降: CDNエッジキャッシュから配信（**レイテンシ 50-80% 削減**）
- 動画読み込み速度: **2-3倍高速化**

### コスト削減
- R2からの転送量削減: **95%以上削減**（ほとんどのリクエストがCDNで処理）
- Cloudflare CDN 転送: 無料（通常プランでも無制限）

### スケーラビリティ
- 同時1000人アクセスでもR2負荷はほぼゼロ
- 世界中のエッジサーバーに分散配信

---

## トラブルシューティング

### Q: カスタムドメインの追加に失敗する
**A:** DNSレコードが手動で設定されている場合は削除してから再試行

### Q: CF-Cache-Status が常に MISS になる
**A:** Cache Rules の条件（Hostname, URI Path）を再確認

### Q: 動画が再生されない
**A:** CORS設定を確認（R2バケット設定で `Access-Control-Allow-Origin: *` が必要）

---

## 参考リンク
- [Cloudflare R2 Custom Domains](https://developers.cloudflare.com/r2/buckets/public-buckets/#custom-domains)
- [Cloudflare Cache Rules](https://developers.cloudflare.com/cache/how-to/cache-rules/)
