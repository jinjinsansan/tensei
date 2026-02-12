"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { TicketBalanceItem } from '@/lib/utils/tickets';

type TicketBalanceCarouselProps = {
  tickets: TicketBalanceItem[];
};

const META: Record<string, { title: string; subtitle: string; gradient: string; ribbon: string }> = {
  free: {
    title: '無料の栞',
    subtitle: 'FREE BOOKMARK',
    gradient: 'from-[#4a3228] via-[#3a251b] to-[#2c1810]',
    ribbon: 'bg-[#b77a4b]',
  },
  basic: {
    title: '銅の栞',
    subtitle: 'BRONZE BOOKMARK',
    gradient: 'from-[#5b2f16] via-[#4a2210] to-[#2c1810]',
    ribbon: 'bg-[#b4632b]',
  },
  epic: {
    title: '銀の栞',
    subtitle: 'SILVER BOOKMARK',
    gradient: 'from-[#4a525f] via-[#3a3f4a] to-[#1e1f26]',
    ribbon: 'bg-[#b9c0c9]',
  },
  premium: {
    title: '金の栞',
    subtitle: 'GOLD BOOKMARK',
    gradient: 'from-[#6e4a12] via-[#5b390c] to-[#2c1810]',
    ribbon: 'bg-[#d7b153]',
  },
  ex: {
    title: '白金の栞',
    subtitle: 'PLATINUM BOOKMARK',
    gradient: 'from-[#5d3c7b] via-[#3a224f] to-[#1e142c]',
    ribbon: 'bg-[#c5a9ff]',
  },
};

function getMeta(code: string) {
  return (
    META[code] ?? {
      title: '栞',
      subtitle: 'BOOKMARK',
      gradient: 'from-[#4a3228] to-[#2c1810]',
      ribbon: 'bg-[#c9a84c]',
    }
  );
}

export function TicketBalanceCarousel({ tickets }: TicketBalanceCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  const scrollByAmount = useCallback((direction: 'left' | 'right') => {
    const el = scrollerRef.current;
    if (!el) return;
    const offset = direction === 'left' ? -220 : 220;
    el.scrollBy({ left: offset, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateScrollState();
    const handleScroll = () => updateScrollState();
    el.addEventListener('scroll', handleScroll, { passive: true });
    const resizeObserver = new ResizeObserver(() => updateScrollState());
    resizeObserver.observe(el);
    return () => {
      el.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [updateScrollState]);

  useEffect(() => {
    updateScrollState();
  }, [tickets, updateScrollState]);

  return (
    <div className="relative">
      <div ref={scrollerRef} className="flex snap-x gap-3 overflow-x-auto pb-2" onWheel={(event) => {
        const el = scrollerRef.current;
        if (!el) return;
        const vertical = Math.abs(event.deltaY) > Math.abs(event.deltaX);
        if (!vertical) return;
        event.preventDefault();
        el.scrollBy({ left: event.deltaY, behavior: 'auto' });
      }}>
        {tickets.map((ticket) => {
          const meta = getMeta(ticket.code);
          return (
            <div
              key={ticket.code}
              className={`relative min-h-[110px] min-w-[200px] snap-start rounded-2xl border border-accent/25 bg-gradient-to-r ${meta.gradient} px-5 py-4 shadow-library-card`}
            >
              <div className="absolute right-4 top-2 h-16 w-1.5 rounded-full bg-accent/40" />
              <div className={`absolute right-8 top-0 w-8 rounded-b-md ${meta.ribbon}`} aria-hidden />
              <div className="space-y-2">
                <p className="text-[0.55rem] font-semibold uppercase tracking-[0.35em] text-accent">{meta.subtitle}</p>
                <p className="text-xl font-medium text-primary">{meta.title}</p>
              </div>
              <div className="mt-4 text-right">
                <p className="text-3xl font-semibold text-primary">{ticket.quantity}</p>
                <p className="text-xs text-secondary">枚の栞</p>
              </div>
            </div>
          );
        })}
      </div>

      {canScrollLeft && (
        <button
          type="button"
          aria-label="前の栞"
          className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full border border-accent/30 bg-card/80 p-1.5 text-primary shadow-library-card"
          onClick={() => scrollByAmount('left')}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {canScrollRight && (
        <button
          type="button"
          aria-label="次の栞"
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full border border-accent/30 bg-card/80 p-1.5 text-primary shadow-library-card"
          onClick={() => scrollByAmount('right')}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
