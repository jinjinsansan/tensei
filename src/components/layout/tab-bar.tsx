"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Sparkles, Users, Menu } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const iconMap = {
  entrance: Home,
  reading: BookOpen,
  shelf: BookOpen,
  study: Menu,
  gacha: Sparkles,
  social: Users,
  menu: Menu,
} as const;

export type TabBarIconKey = keyof typeof iconMap;

export type TabBarItem = {
  label: string;
  href: string;
  icon: TabBarIconKey;
  primary?: boolean;
};

type TabBarProps = {
  items: TabBarItem[];
};

export function TabBar({ items }: TabBarProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 z-50 px-4 pb-[env(safe-area-inset-bottom)] bottom-[calc(1rem+env(safe-area-inset-bottom))] sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <div className="tria-tabbar mx-auto flex w-full max-w-[420px] items-center gap-3 rounded-full px-4 py-2 text-sm">
        {items.map((item) => {
          const Icon = iconMap[item.icon];
          if (!Icon) return null;
          const isActive = matchPath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                'tab-bar-item flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-1.5 text-[0.7rem] transition-all',
                item.primary && 'tab-bar-primary',
                isActive && !item.primary && 'tab-bar-active',
                !isActive && !item.primary && 'text-secondary'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5',
                  item.primary ? 'text-[#0A0A0A]' : isActive ? 'text-accent' : 'text-secondary'
                )}
                strokeWidth={item.primary ? 2.4 : isActive ? 2.3 : 2.2}
              />
              <span className={cn(
                'font-medium tracking-[0.15em]',
                item.primary && 'text-[0.6rem] font-semibold uppercase tracking-[0.25em]'
              )}>
                {item.label}
              </span>
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
