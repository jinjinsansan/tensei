import type { CdColor } from '@/lib/gacha/common/types';

let audioCtx: AudioContext | null = null;

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new window.AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }
  return audioCtx;
}

function playTone(frequency: number, durationMs: number, type: OscillatorType = 'sine', volume = 0.2) {
  const ctx = ensureContext();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = volume;
  oscillator.connect(gain).connect(ctx.destination);
  const now = ctx.currentTime;
  oscillator.start(now);
  oscillator.stop(now + durationMs / 1000);
  gain.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000);
}

const COUNTDOWN_TONES: Record<CdColor, number> = {
  green: 220,
  blue: 310,
  red: 420,
  rainbow: 540,
};

export function playCountdownTone(color: CdColor) {
  playTone(COUNTDOWN_TONES[color], 110, 'triangle', 0.12);
}

export function playPuchunSfx() {
  playTone(180, 130, 'square', 0.18);
  setTimeout(() => playTone(80, 220, 'sawtooth', 0.16), 90);
}

export function playDondenSfx() {
  playTone(260, 160, 'sawtooth', 0.18);
  setTimeout(() => playTone(360, 200, 'triangle', 0.14), 120);
}

export function playCardRevealCue(starRating: number) {
  if (starRating >= 11) {
    playTone(620, 220, 'triangle', 0.2);
    setTimeout(() => playTone(740, 260, 'triangle', 0.16), 140);
  } else if (starRating >= 9) {
    playTone(520, 180, 'triangle', 0.16);
  } else {
    playTone(420, 120, 'triangle', 0.12);
  }
}
