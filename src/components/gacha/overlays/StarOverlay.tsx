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
    <div className="pointer-events-none absolute inset-x-0 bottom-24 flex items-center justify-center gap-2">
      {Array.from({ length: 5 }).map((_, index) => {
        const isLit = index < visibleStars;
        return (
          <div
            key={index}
            className={`text-5xl transition-all duration-300 ${
              isLit ? 'scale-100 opacity-100' : 'scale-75 opacity-40'
            }`}
            style={{
              filter: isLit
                ? 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.8))'
                : 'grayscale(100%) brightness(0.5)',
            }}
          >
            {isLit ? '⭐' : '☆'}
          </div>
        );
      })}
    </div>
  );
}
