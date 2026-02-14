"use client";

import { useEffect, useState } from 'react';

type Props = {
  starCount: number; // 1-5
};

export function StarOverlay({ starCount }: Props) {
  const [visibleStars, setVisibleStars] = useState(0);

  useEffect(() => {
    setVisibleStars(0);
    const timers: NodeJS.Timeout[] = [];

    for (let i = 0; i < starCount; i++) {
      const timer = setTimeout(() => {
        setVisibleStars(i + 1);
      }, i * 300);
      timers.push(timer);
    }

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [starCount]);

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="inline-flex flex-col items-center gap-2 rounded-full bg-black/45 px-6 py-3 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
        <p className="text-[10px] tracking-[0.4em] text-white/70">期待度</p>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, index) => {
            const isLit = index < visibleStars;
            return (
              <span
                key={index}
                className={`text-3xl leading-none transition-all duration-300 ${
                  isLit ? 'scale-100 opacity-100 text-yellow-300' : 'scale-90 opacity-35 text-zinc-500'
                }`}
                style={{
                  textShadow: isLit
                    ? '0 0 12px rgba(250, 250, 210, 0.9), 0 0 26px rgba(99, 102, 241, 0.7)'
                    : '0 0 4px rgba(15,23,42,0.8)',
                }}
              >
                {isLit ? '★' : '★'}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
