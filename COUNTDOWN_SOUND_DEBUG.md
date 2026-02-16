# カウントダウン効果音が2回聞こえる問題のデバッグ手順

## 🔍 現在の状態

デバッグログを追加したバージョンをデプロイ済み（コミット 488e081）

## 📋 デバッグ手順

### 1. ブラウザのコンソールを開く
- F12キーまたは右クリック→「検証」→「Console」タブ

### 2. カウントダウンを実行
1. ガチャを開始
2. STANDBY → COUNTDOWN フェーズに入る
3. **NEXTボタンを1回クリック**
4. コンソールログを確認

### 3. ログの確認ポイント

#### 正常な場合（音が1回のみ）
```
[GachaPlayer] onPlay fired: countdown-0 phase: COUNTDOWN
[SFX] playCountdownHit() called
```

#### 異常な場合（音が2回）
```
# パターンA: onPlayが2回発火
[GachaPlayer] onPlay fired: countdown-0 phase: COUNTDOWN
[SFX] playCountdownHit() called
[GachaPlayer] onPlay fired: countdown-0 phase: COUNTDOWN  ← 重複
[GachaPlayer] onPlay ignored (duplicate): countdown-0      ← 検出されるはず
```

```
# パターンB: 異なる動画キーで2回発火（古い動画と新しい動画）
[GachaPlayer] onPlay fired: countdown-0 phase: COUNTDOWN
[SFX] playCountdownHit() called
[GachaPlayer] onPlay fired: countdown-1 phase: COUNTDOWN  ← 切り替わりが速すぎる
[SFX] playCountdownHit() called                            ← 2回目の音
```

```
# パターンC: playCountdownHit()が直接2回呼ばれている
[SFX] playCountdownHit() called
[SFX] playCountdownHit() called  ← onPlayログなしで2回目
```

## 🎯 原因別の修正方法

### パターンA: onPlayの重複発火
→ 現在の`lastPlayedVideoKeyRef`で防げているはず
→ ログで「ignored (duplicate)」が出ていない場合、チェックが効いていない

### パターンB: 動画切り替えが速すぎる
→ NEXTボタンクリック時に明示的に音をストップする
→ または、`videoReady === false` の間は音を鳴らさない

### パターンC: 複数箇所から呼ばれている
→ コールスタックを確認して呼び出し元を特定

## 💡 推奨される修正案

デバッグログの結果に基づいて、以下のいずれかを実装：

### 修正案1: videoReadyチェックを追加
```typescript
const handlePhaseVideoPlay = useCallback(() => {
  // videoReadyがfalseの場合は音を鳴らさない（切り替え中）
  if (!videoReady && phase === 'COUNTDOWN') {
    console.log('[GachaPlayer] Skipping sound during transition');
    setVideoReady(true);
    return;
  }
  
  // ...既存の処理
}, [phase, phaseVideoKey, videoReady]);
```

### 修正案2: カウントダウン専用のインデックス追跡
```typescript
const lastCountdownIndexRef = useRef<number>(-1);

const handlePhaseVideoPlay = useCallback(() => {
  if (phase === 'COUNTDOWN') {
    // 同じインデックスでは音を鳴らさない
    if (lastCountdownIndexRef.current === countdownIndex) {
      console.log('[GachaPlayer] Same countdown index, skipping sound');
      setVideoReady(true);
      return;
    }
    lastCountdownIndexRef.current = countdownIndex;
    playCountdownHit();
  }
  setVideoReady(true);
}, [phase, countdownIndex]);
```

### 修正案3: 音の再生間隔制限
```typescript
let lastSoundTime = 0;

export function playCountdownHit() {
  const now = Date.now();
  if (now - lastSoundTime < 300) {  // 300ms以内の連続再生を防ぐ
    console.log('[SFX] Skipping sound (too soon)');
    return;
  }
  lastSoundTime = now;
  
  const audio = getCountdownAudio();
  if (!audio) return;
  void audio.play().catch(() => undefined);
}
```

## 📝 次のステップ

1. Vercelデプロイ完了を待つ
2. ガチャを実行してコンソールログを確認
3. ログ結果をDroidに報告
4. 適切な修正案を実装
