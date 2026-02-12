"use client";

import type { TelopType } from '@/lib/gacha/types';

const telopCopy: Record<TelopType | 'default', string> = {
  neutral: '物語が進行しています',
  chance: '前兆のきらめき',
  win: '新章開幕の気配',
  lose: '白紙の章が見えた',
  reversal: '隠された章が開く',
  epic: '伝説の書が震える',
  default: 'ページをめくっています',
};

const particles = [
  { id: 'telop-particle-1', left: '5%', delay: '0s', duration: '5s' },
  { id: 'telop-particle-2', left: '15%', delay: '0.5s', duration: '6s' },
  { id: 'telop-particle-3', left: '30%', delay: '1s', duration: '5.5s' },
  { id: 'telop-particle-4', left: '45%', delay: '0.2s', duration: '6.5s' },
  { id: 'telop-particle-5', left: '60%', delay: '0.8s', duration: '5.2s' },
  { id: 'telop-particle-6', left: '75%', delay: '1.2s', duration: '6.8s' },
  { id: 'telop-particle-7', left: '90%', delay: '0.3s', duration: '5.7s' },
  { id: 'telop-particle-8', left: '35%', delay: '1.4s', duration: '6.1s' },
  { id: 'telop-particle-9', left: '55%', delay: '0.6s', duration: '5.4s' },
  { id: 'telop-particle-10', left: '80%', delay: '1s', duration: '6.3s' },
];

type Props = {
  telopType?: TelopType | null;
  text?: string | null;
  order?: string;
};

export function TelopOverlay({ telopType, text, order }: Props) {
  const displayText = text ?? telopCopy[telopType ?? 'default'];
  return (
    <div className="pointer-events-none absolute inset-x-4 top-4">
      <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-r from-[#1A1A1A]/90 to-[#111111]/90 px-4 py-3 text-primary shadow-library-card">
        <div className="absolute inset-0 opacity-40">
          {particles.map((particle) => (
            <span
              key={particle.id}
              className="absolute h-1 w-1 rounded-full bg-accent"
              style={{
                left: particle.left,
                animation: `particle-float ${particle.duration} linear infinite`,
                animationDelay: particle.delay,
              }}
            />
          ))}
        </div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-accent">
          {order ? `Page ${order}` : 'Library Story'}
        </p>
        <p className="text-lg font-medium text-primary">{displayText}</p>
      </div>
    </div>
  );
}
