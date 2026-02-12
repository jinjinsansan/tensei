import type { RtpSlot } from './config';
import { randomFloat } from '@/lib/utils/random';

export function normalizeRtpSlots(slots: RtpSlot[]): RtpSlot[] {
  const total = slots.reduce((sum, slot) => sum + slot.probability, 0);
  if (total <= 0) {
    const fallback = 1 / slots.length;
    return slots.map((slot) => ({ ...slot, probability: fallback }));
  }
  return slots.map((slot) => ({ ...slot, probability: slot.probability / total }));
}

export function drawStar(slots: RtpSlot[]): number {
  const normalized = normalizeRtpSlots(slots);
  const roll = randomFloat();
  let cumulative = 0;
  for (const slot of normalized) {
    cumulative += slot.probability;
    if (roll <= cumulative) {
      return slot.star;
    }
  }
  return normalized[normalized.length - 1]?.star ?? 1;
}
