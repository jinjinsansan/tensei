# Cloudflare R2 素材上書きアップロード指示（Claude Code用）

## 背景

昭一モジュールの★7ビーチバーと★10幸せ家庭の動画・画像について、
キャラクターの外見に整合性の問題があったため修正版を再生成した。
既にCloudflare R2に古いバージョンがアップロード済みのため、
修正版ファイルで上書きする必要がある。

## 作業内容

以下の11ファイルを、ローカルの修正版ファイルでCloudflare R2上の
同名ファイルを上書きアップロードすること。

---

## 上書き対象ファイル一覧（11ファイル）

### メインシーン動画（8本）

| ローカルファイル名 | Cloudflare R2 アップロード先パス |
|---|---|
| shoichi_c07_1.mp4 | `/gacha/characters/shoichi/main/shoichi_c07_1.mp4` |
| shoichi_c07_2.mp4 | `/gacha/characters/shoichi/main/shoichi_c07_2.mp4` |
| shoichi_c07_3.mp4 | `/gacha/characters/shoichi/main/shoichi_c07_3.mp4` |
| shoichi_c07_4.mp4 | `/gacha/characters/shoichi/main/shoichi_c07_4.mp4` |
| shoichi_c10_1.mp4 | `/gacha/characters/shoichi/main/shoichi_c10_1.mp4` |
| shoichi_c10_2.mp4 | `/gacha/characters/shoichi/main/shoichi_c10_2.mp4` |
| shoichi_c10_3.mp4 | `/gacha/characters/shoichi/main/shoichi_c10_3.mp4` |
| shoichi_c10_4.mp4 | `/gacha/characters/shoichi/main/shoichi_c10_4.mp4` |

### どんでん返し動画（1本）

| ローカルファイル名 | Cloudflare R2 アップロード先パス |
|---|---|
| shoichi_rev_c05_c10_2.mp4 | `/gacha/characters/shoichi/donden/shoichi_rev_c05_c10_2.mp4` |

### カード画像（2枚）

| ローカルファイル名 | Cloudflare R2 アップロード先パス |
|---|---|
| shoichi_card07_beach_bar.png | `/shoichi_cards/shoichi_card07_beach_bar.png` |
| shoichi_card10_happy_family.png | `/shoichi_cards/shoichi_card10_happy_family.png` |

---

## 実行手順

### 1. ローカルに修正版ファイルを配置

修正版ファイルをプロジェクトのアップロード用ディレクトリにまとめる。

```bash
mkdir -p ./upload_fix/main
mkdir -p ./upload_fix/donden
mkdir -p ./upload_fix/cards

# 修正版動画をコピー（ダウンロードフォルダから）
cp ~/Downloads/修正版昭一映像/shoichi_c07_1.mp4 ./upload_fix/main/
cp ~/Downloads/修正版昭一映像/shoichi_c07_2.mp4 ./upload_fix/main/
cp ~/Downloads/修正版昭一映像/shoichi_c07_3.mp4 ./upload_fix/main/
cp ~/Downloads/修正版昭一映像/shoichi_c07_4.mp4 ./upload_fix/main/
cp ~/Downloads/修正版昭一映像/shoichi_c10_1.mp4 ./upload_fix/main/
cp ~/Downloads/修正版昭一映像/shoichi_c10_2.mp4 ./upload_fix/main/
cp ~/Downloads/修正版昭一映像/shoichi_c10_3.mp4 ./upload_fix/main/
cp ~/Downloads/修正版昭一映像/shoichi_c10_4.mp4 ./upload_fix/main/
cp ~/Downloads/修正版昭一映像/shoichi_rev_c05_c10_2.mp4 ./upload_fix/donden/

# 修正版カード画像をコピー
cp ~/Downloads/shoichi_fix_c07_c10/shoichi_card07_beach_bar.png ./upload_fix/cards/
cp ~/Downloads/shoichi_fix_c07_c10/shoichi_card10_happy_family.png ./upload_fix/cards/
```

### 2. Cloudflare R2 にアップロード（wrangler CLI使用）

```bash
# メインシーン動画 8本を上書き
for file in ./upload_fix/main/shoichi_c07_*.mp4 ./upload_fix/main/shoichi_c10_*.mp4; do
  filename=$(basename "$file")
  echo "Uploading $filename to /gacha/characters/shoichi/main/$filename"
  wrangler r2 object put "gacha-bucket/gacha/characters/shoichi/main/$filename" \
    --file="$file" \
    --content-type="video/mp4"
done

# どんでん返し動画 1本を上書き
echo "Uploading shoichi_rev_c05_c10_2.mp4 to donden/"
wrangler r2 object put "gacha-bucket/gacha/characters/shoichi/donden/shoichi_rev_c05_c10_2.mp4" \
  --file="./upload_fix/donden/shoichi_rev_c05_c10_2.mp4" \
  --content-type="video/mp4"

# カード画像 2枚を上書き
echo "Uploading shoichi_card07_beach_bar.png"
wrangler r2 object put "gacha-bucket/shoichi_cards/shoichi_card07_beach_bar.png" \
  --file="./upload_fix/cards/shoichi_card07_beach_bar.png" \
  --content-type="image/png"

echo "Uploading shoichi_card10_happy_family.png"
wrangler r2 object put "gacha-bucket/shoichi_cards/shoichi_card10_happy_family.png" \
  --file="./upload_fix/cards/shoichi_card10_happy_family.png" \
  --content-type="image/png"
```

### 3. キャッシュパージ（CDNキャッシュが残っている場合）

```bash
# Cloudflare CDNのキャッシュをパージ（上書きが即反映されるように）
# 方法1: Cloudflareダッシュボードから該当URLをパージ
# 方法2: API経由でパージ
curl -X POST "https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer {API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "files": [
      "https://{CDN_DOMAIN}/gacha/characters/shoichi/main/shoichi_c07_1.mp4",
      "https://{CDN_DOMAIN}/gacha/characters/shoichi/main/shoichi_c07_2.mp4",
      "https://{CDN_DOMAIN}/gacha/characters/shoichi/main/shoichi_c07_3.mp4",
      "https://{CDN_DOMAIN}/gacha/characters/shoichi/main/shoichi_c07_4.mp4",
      "https://{CDN_DOMAIN}/gacha/characters/shoichi/main/shoichi_c10_1.mp4",
      "https://{CDN_DOMAIN}/gacha/characters/shoichi/main/shoichi_c10_2.mp4",
      "https://{CDN_DOMAIN}/gacha/characters/shoichi/main/shoichi_c10_3.mp4",
      "https://{CDN_DOMAIN}/gacha/characters/shoichi/main/shoichi_c10_4.mp4",
      "https://{CDN_DOMAIN}/gacha/characters/shoichi/donden/shoichi_rev_c05_c10_2.mp4",
      "https://{CDN_DOMAIN}/shoichi_cards/shoichi_card07_beach_bar.png",
      "https://{CDN_DOMAIN}/shoichi_cards/shoichi_card10_happy_family.png"
    ]
  }'
```

### 4. 確認

```bash
# アップロード確認：各ファイルが存在するか確認
wrangler r2 object head "gacha-bucket/gacha/characters/shoichi/main/shoichi_c07_1.mp4"
wrangler r2 object head "gacha-bucket/gacha/characters/shoichi/main/shoichi_c10_1.mp4"
wrangler r2 object head "gacha-bucket/gacha/characters/shoichi/donden/shoichi_rev_c05_c10_2.mp4"
wrangler r2 object head "gacha-bucket/shoichi_cards/shoichi_card07_beach_bar.png"
wrangler r2 object head "gacha-bucket/shoichi_cards/shoichi_card10_happy_family.png"

# ブラウザでも動画が正しく再生されるか確認
# https://{CDN_DOMAIN}/gacha/characters/shoichi/main/shoichi_c07_1.mp4
# https://{CDN_DOMAIN}/gacha/characters/shoichi/main/shoichi_c10_1.mp4
```

---

## 修正理由（参考）

- ★7 ビーチバー: 昭一の外見が若返りすぎていた → 50歳おじさん（ハゲ・メガネ維持）+ 日焼け + 少し痩せた健康的な姿に統一
- ★10 幸せ家庭: 昭一が30-40代に若返っていた → 50歳おじさんそのまま（ハゲ・メガネ・太め）に統一
- ★5→★10 どんでん返し到着コマ: ★10の外見修正に合わせて再生成

## 重要な注意

- R2のバケット名（`gacha-bucket`）は実際の環境に合わせて変更すること
- `{ZONE_ID}`、`{API_TOKEN}`、`{CDN_DOMAIN}` は実際の値に置き換えること
- 上書き後、必ずCDNキャッシュをパージして修正版が即反映されるようにすること
- 他の86本中の残り77本は変更なし、触らないこと
