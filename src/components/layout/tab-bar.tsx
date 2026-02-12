"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Landmark, BookOpenCheck, LibraryBig, PenSquare } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const iconMap = {
  entrance: Landmark,
  reading: BookOpenCheck,
  shelf: LibraryBig,
  study: PenSquare,
} as const;

export type TabBarIconKey = keyof typeof iconMap;

export type TabBarItem = {
  label: string;
  href: string;
  icon: TabBarIconKey;
};

type TabBarProps = {
  items: TabBarItem[];
};

export function TabBar({ items }: TabBarProps) {
  const pathname = usePathname();

  return (
    <nav className="library-tabbar">
      <div className="library-tabbar__content">
        {items.map((item) => {
          const Icon = iconMap[item.icon];
          if (!Icon) return null;
          const isActive = matchPath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn('library-tabbar__item', isActive && 'library-tabbar__item--active')}
            >
              <Icon
                className={cn('h-5 w-5', isActive ? 'text-library-accent' : 'text-library-text-secondary')}
                strokeWidth={isActive ? 2.2 : 2.5}
              />
              <span className="font-serif text-[0.55rem] tracking-[0.3em]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function matchPath(current: string | null, target: string) {
  if (!current) return false;
  if (target === '/') {
    return current === '/';
  }
  return current === target || current.startsWith(`${target}/`);
}
