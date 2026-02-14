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
  const audio = getCountdownAudio();
  if (!audio) return;
  void audio.play().catch(() => undefined);
}
