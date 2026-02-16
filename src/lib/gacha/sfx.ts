let countdownAudio: HTMLAudioElement | null = null;
let lastPlayTime = 0;

function getCountdownAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!countdownAudio) {
    countdownAudio = new Audio('/videos/common/countdown/countdown_sfx.wav');
  }
  countdownAudio.currentTime = 0;
  countdownAudio.volume = 0.8;
  return countdownAudio;
}

export function playCountdownHit() {
  const now = Date.now();
  const timeSinceLastPlay = now - lastPlayTime;
  
  console.log('[SFX] playCountdownHit() called, time since last:', timeSinceLastPlay + 'ms');
  
  // 300ms以内の連続再生を防ぐ（動画切り替え時の重複音を防止）
  if (timeSinceLastPlay < 300) {
    console.log('[SFX] Skipping sound (too soon after previous play)');
    return;
  }

  const audio = getCountdownAudio();
  if (!audio) {
    console.warn('[SFX] audio is null');
    return;
  }
  void audio
    .play()
    .then(() => {
      lastPlayTime = now;
    })
    .catch((err) => {
      console.warn('[SFX] audio play failed', err);
    });
}

// 事前に Audio 要素だけ作っておきたい場合に使用
export function primeCountdownHit() {
  void getCountdownAudio();
}
