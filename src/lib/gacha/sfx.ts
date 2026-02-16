let countdownAudio: HTMLAudioElement | null = null;

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
  console.log('[SFX] playCountdownHit() called');
  const audio = getCountdownAudio();
  if (!audio) {
    console.warn('[SFX] audio is null');
    return;
  }
  void audio.play().catch(() => undefined);
}

// 事前に Audio 要素だけ作っておきたい場合に使用
export function primeCountdownHit() {
  void getCountdownAudio();
}
