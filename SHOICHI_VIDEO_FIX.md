# 昭一編タイトル動画が真っ黒になる問題の修正

## 🔴 問題の原因

昭一の動画ファイルが**プロジェクトルートの `昭一映像/` フォルダ**に置かれていましたが、Webアプリからアクセスできる`public/videos/characters/shoichi/`フォルダには配置されていませんでした。

### 期待されるパス
```
buildCharacterAssetPath('shoichi', 'title', 'shoichi_title_c01.mp4')
↓
/videos/characters/shoichi/title/shoichi_title_c01.mp4
```

### 実際の状態
- ✅ ファイルは存在: `昭一映像/shoichi_title_c01.mp4`
- ❌ Webから見えない: `public/videos/characters/shoichi/` が存在しない

### 症状
- タイトル動画が真っ黒（ビデオが読み込めない）
- ★オーバーレイは表示される（コード自体は正常）
- NEXTボタンが押せない（`videoReady`がfalseのまま）
- `onPlay`イベントが発火しない（ビデオが読み込めないため）

---

## ✅ 実施した修正

### 1. フォルダ構造の作成
```bash
mkdir -p public/videos/characters/shoichi/{title,main,pre,chance,donden}
```

### 2. 動画ファイルのコピー
```bash
# タイトル動画（12本）
cp 昭一映像/shoichi_title_*.mp4 public/videos/characters/shoichi/title/

# メイン演出（48本）
cp 昭一映像/shoichi_c[0-9][0-9]_*.mp4 public/videos/characters/shoichi/main/

# 転生前シーン（8本）
cp 昭一映像/shoichi_pre_*.mp4 public/videos/characters/shoichi/pre/

# チャンスシーン（4本）
cp 昭一映像/shoichi_chance_*.mp4 public/videos/characters/shoichi/chance/

# どんでん返し（20本）
cp 昭一映像/shoichi_rev_*.mp4 public/videos/characters/shoichi/donden/
```

### 3. コピー完了確認
- ✅ Title: 12本
- ✅ Main: 48本
- ✅ Pre: 8本
- ✅ Chance: 4本
- ✅ Donden: 20本
- **合計: 92本**

---

## 🎯 修正後の期待される動作

### 昭一編のタイトル動画フェーズ
1. ✅ タイトル動画が正常に表示される
2. ✅ ★オーバーレイが表示される
3. ✅ 動画が再生される（`onPlay`イベント発火）
4. ✅ `videoReady`が`true`になる
5. ✅ NEXTボタンが有効になる
6. ✅ NEXTボタンをクリックして次のフェーズに進める

### 健太編との比較
| フェーズ | 健太編 | 昭一編 |
|---------|-------|-------|
| STANDBY | ✅ | ✅ |
| COUNTDOWN | ✅ | ✅ |
| PUCHUN | ✅ | ✅ |
| TITLE_VIDEO | ✅ | ✅（修正後） |
| PRE_SCENE | ✅ | ✅（修正後） |
| CHANCE_SCENE | ✅ | ✅（修正後） |
| MAIN_SCENE | ✅ | ✅（修正後） |
| DONDEN_SCENE | ✅ | ✅（修正後） |
| CARD_REVEAL | ✅ | ✅ |

---

## 🔍 技術的な詳細

### 動画パス生成ロジック
```typescript
// shoichi-module.ts
getTitleVideoPath: (cardId) =>
  buildCharacterAssetPath('shoichi', 'title', `shoichi_title_${getCardCode(cardId)}.mp4`),

// assets.ts
export function buildCharacterAssetPath(characterId: string, ...segments: string[]): string {
  return buildGachaAssetPath('characters', characterId, ...segments);
}

// 最終的なパス
// /videos/characters/shoichi/title/shoichi_title_c01.mp4
```

### ファイル命名規則
| カードID | getCardCode() | ファイル名 |
|---------|---------------|-----------|
| card01_fish | c01 | shoichi_title_c01.mp4 |
| card02_train | c02 | shoichi_title_c02.mp4 |
| card12_investor | c12 | shoichi_title_c12.mp4 |

---

## 📝 今後の注意事項

新しいキャラクターを追加する際は：
1. ✅ コードでキャラクターモジュールを実装
2. ✅ データベースにキャラクターデータを投入
3. ✅ **動画ファイルを`public/videos/characters/{characterId}/`に配置**
4. ✅ カード画像を`public/{characterId}_cards/`に配置

**重要:** プロジェクトルートに動画を置いただけでは、Webアプリからアクセスできません！
