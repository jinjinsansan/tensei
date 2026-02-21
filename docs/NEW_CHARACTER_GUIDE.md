# 新キャラクター追加ガイド

このドキュメントは新しいDroidが新キャラクターを追加する際に必ず読むべき手順・注意事項・禁止事項をまとめたものです。

---

## 1. ファイル構成の全体像

```
src/lib/gacha/characters/
  {character}/
    {character}-module.ts      # CharacterModule 定義（メイン）
    {character}-cards.ts       # カード定義
    {character}-donden.ts      # どんでん返しルート定義
  character-registry.ts        # 全キャラクター登録
  index.ts                     # getCharacter() エクスポート

public/
  {character}_cards_v2/        # カード画像 (PNG)
  splash_cards_{character}/    # How-to-play用カード画像 (PNG)
  videos/characters/{character}/
    title/                     # タイトル動画
    pre/                       # 転生前シーン動画
    chance/                    # 転生チャンス動画
    main/                      # メインシーン動画
    donden/                    # どんでん返し動画
```

---

## 2. 追加手順（順番を守ること）

### Step 1: 動画ファイルの faststart 処理（必須）

**新しい動画ファイルは必ず faststart を適用してから R2 にアップロードする。**

```bash
# 1本ずつ処理
ffmpeg -i input.mp4 -c copy -movflags +faststart output.mp4

# ディレクトリ一括処理
for f in /path/to/videos/*.mp4; do
  ffmpeg -i "$f" -c copy -movflags +faststart "${f%.mp4}_fs.mp4"
done
```

#### faststart とは
MP4 ファイルのメタデータ（moovアトム）をファイル先頭に移動する処理。
これをしないと**ブラウザはファイルを全部ダウンロードしてから再生を開始する**ため、
動画が非常に重く感じられる。After Effects / iPhoneなどで書き出したMP4は
デフォルトで moov が末尾にある。

#### 確認方法
```python
with open('video.mp4', 'rb') as f:
    data = f.read(100)
print('moov_at_start:', data.find(b'moov') != -1)  # True なら OK
```

### Step 2: R2 アップロード

```bash
# キャラクター単位でアップロード
python3 upload-character-to-r2.py {character_name}
```

アップロード後、必ず R2 上のファイルを検証する（後述）。

### Step 3: エッジキャッシュのパージ

R2 にファイルをアップロードしても、Workerのエッジキャッシュに古いファイルが残っている。
**Worker の再デプロイだけではキャッシュはパージされない。**

`cloudflare/r2-video-worker/src/index.ts` の `CACHE_VERSION` を変える：

```typescript
// 変更前
const CACHE_VERSION = 'v2';
// 変更後（数字をインクリメント）
const CACHE_VERSION = 'v3';
```

変更後に再デプロイ：

```bash
cd cloudflare/r2-video-worker && npx wrangler deploy
```

**再デプロイ後は必ずキャッシュをウォームアップする。** キャッシュパージ直後はR2直接配信になりモバイル回線では動画が止まる。

```bash
# standby + puchun ウォームアップ
for f in blackstandby bluestandby yellowstandby redstandby whitestandby rainbowstandby; do
  curl -s "https://r2-video-worker.goldbenchan.workers.dev/videos/common/standby/${f}.mp4" -o /dev/null &
done
curl -s "https://r2-video-worker.goldbenchan.workers.dev/videos/common/puchun/puchun.mp4" -o /dev/null &

# countdown ウォームアップ
for color in green blue red; do
  for i in 1 2 3 4 5 6 7 8; do
    curl -s "https://r2-video-worker.goldbenchan.workers.dev/videos/common/countdown/cd_${color}_${i}.mp4" -o /dev/null &
  done
done
wait
echo "warmup done"
```

### Step 4: R2 上のファイル検証

```python
import boto3, os
from dotenv import load_dotenv
load_dotenv('env.local')

s3 = boto3.client(
    's3',
    endpoint_url=f'https://{os.environ["CLOUDFLARE_R2_ACCOUNT_ID"]}.r2.cloudflarestorage.com',
    aws_access_key_id=os.environ['CLOUDFLARE_R2_ACCESS_KEY_ID'],
    aws_secret_access_key=os.environ['CLOUDFLARE_R2_SECRET_ACCESS_KEY'],
    region_name='auto',
)
resp = s3.get_object(Bucket='sonshi', Key='videos/characters/{character}/title/{file}.mp4', Range='bytes=0-99')
data = resp['Body'].read()
print('moov_at_start:', data.find(b'moov') != -1)  # True なら OK
```

CDN経由の確認（Worker経由）：

```bash
curl -s --range 0-99 "https://r2-video-worker.goldbenchan.workers.dev/videos/characters/{character}/title/{file}.mp4" -o /tmp/check.bin
python3 -c "
with open('/tmp/check.bin','rb') as f: data=f.read()
print('moov_at_start:', data.find(b'moov') != -1)
"
```

### Step 5: キャラクターモジュール実装

既存キャラクター（yahei など）を参考にコピーして作成する：

- `src/lib/gacha/characters/{character}/{character}-module.ts`
- `src/lib/gacha/characters/{character}/{character}-cards.ts`
- `src/lib/gacha/characters/{character}/{character}-donden.ts`

`character-registry.ts` にインポートと登録を追加：

```typescript
import '@/lib/gacha/characters/{character}/{character}-module';
```

### Step 6: DB マイグレーション

Supabase に新キャラクターのデータを追加する：

```bash
# supabase/migrations/ に新しいファイルを作成
# 既存の yahei マイグレーションを参考にする
```

### Step 7: sync-gacha-data スクリプトの更新

`scripts/sync-gacha-data.ts` に新キャラクターの config を追加する（Vercel ビルドで使用）。

### Step 8: ビルド確認

```bash
npx tsc --noEmit  # TypeScript エラーがないこと
npx next build    # ビルドが通ること
```

---

## 3. ビデオ再生アーキテクチャ（絶対に変えてはいけない部分）

### プリロード戦略（現在の設計）

| コンポーネント | 役割 | 設定 | 理由 |
|---|---|---|---|
| `CommonVideoPreloader` (gacha-neon-player.tsx) | ページ開時に standby 6本+puchun を登録 | `display:none` + `preload="metadata"` | moovだけ数KB取得、帯域を消費しない |
| `GachaPlayer upcomingVideos` (GachaPlayer.tsx) | 再生中に次フェーズの動画を先読み | `display:none` + `preload="auto"` | フェーズ中に次の動画を実DL |
| 再生中の `<video>` | 実際の動画再生 | `preload="auto"` | 通常通り |

### 禁止事項

**① `CommonVideoPreloader` に countdown 動画を追加しない**

countdown は全24本で約97MB。ページ開時に一斉DLすると standby 動画の帯域を奪い、STANDBY が重くなる。countdown は `GachaPlayer.upcomingVideos` が STANDBY フェーズ中に実際に使う1色8本だけを先読みする。

**② プリロード用 `<div>` を `display:none` 以外に変えない**

`position:fixed; opacity:0` にするとブラウザが即座に全ファイルをDLし帯域を使い切る（過去に試して失敗）。

**③ `applyRangeToFullResponse` のような実装を Worker に追加しない**

ReadableStream はbodyを一度読むと枯渇する。Rangeリクエストに対してStreamを切り出す実装は動画データを破損させ、再生できない＋NEXTボタンが永久にロックされる。（過去に試して壊した）

**④ `GachaPlayer.tsx` の `videoReady` フラグを安易に変えない**

このフラグが `false` のままだと NEXT ボタンが永久にロックされる。`onCanPlayThrough` と `onLoadedData` の両方でセットしている理由がある。

**⑤ `GachaPlayer` の `key` を変えない**

`key` が変わるたびにコンポーネントが unmount/remount され、ダウンロード済みの動画データが破棄される。現在は `sessionId` を key にしており、同じセッション内では一切変わらない。

---

## 4. CDN アーキテクチャ

```
ブラウザ
  ↓ Range: bytes=0-xxxxx (常にRangeリクエスト)
Cloudflare Worker (r2-video-worker.goldbenchan.workers.dev)
  ↓ キャッシュHIT → エッジから即返却
  ↓ キャッシュMISS → R2 から取得 → キャッシュ保存
Cloudflare R2 (bucket: sonshi)
  videos/
    common/
      standby/     blackstandby.mp4 など6本
      puchun/      puchun.mp4
      countdown/   cd_green_1.mp4 〜 cd_red_8.mp4 (24本)
    characters/
      kenta/
      shoichi/
      tatumi/
      yahei/
```

Worker のソース: `cloudflare/r2-video-worker/src/index.ts`
- RangeリクエストはR2に直接委譲（Worker Cacheでのbodyスライスは禁止）
- 全体取得（非Range）のみ `caches.default` に保存
- `CACHE_VERSION` でキャッシュキーを管理

---

## 5. よくある問題と対処法

### 動画が重い・再生が遅い

1. faststart を確認する（moovが先頭にあるか）
2. R2上のファイルが正しく更新されているか確認（CDN経由ではなくR2 APIで直接確認）
3. エッジキャッシュに古いファイルが残っていないか確認（`CACHE_VERSION` をインクリメント）

### NEXT ボタンが押せない・黒画面

- `videoReady` フラグが立っていない
- 動画ファイルが破損している可能性（faststart 処理時に元ファイルを上書きするミスなど）
- Worker の Range 処理でデータが壊れている（Worker のコードを変更した場合）

### カード画像が表示されない

- `src/lib/gacha/card-image-overrides.ts` にオーバーライドが必要な場合がある
- `public/{character}_cards_v2/` にファイルが存在するか確認

---

## 6. 環境変数

| 変数名 | 説明 |
|---|---|
| `NEXT_PUBLIC_GACHA_ASSET_BASE_URL` | 動画配信元URL（現在: `https://r2-video-worker.goldbenchan.workers.dev/videos`） |
| `CLOUDFLARE_R2_ACCOUNT_ID` | R2 アカウントID |
| `CLOUDFLARE_R2_BUCKET` | R2 バケット名（`sonshi`） |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | R2 アクセスキー |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | R2 シークレットキー |

---

## 7. 参考実装

新キャラクター追加の最新の参考実装は `yahei` キャラクター。
- `src/lib/gacha/characters/yahei/` — モジュール・カード・どんでん定義
- `supabase/migrations/` — yahei 追加時のマイグレーションファイル
- `scripts/sync-gacha-data.ts` — yahei の config エントリ
