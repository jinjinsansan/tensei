export const dynamic = "force-dynamic";

import Link from "next/link";
import type { ReactNode } from "react";

const links = [
  { href: '/admin', label: '蔵書ダッシュボード' },
  { href: '/admin/characters', label: '登場人物管理' },
  { href: '/admin/cards', label: '物語の書' },
  { href: '/admin/scenarios', label: '物語管理' },
  { href: '/admin/stats', label: '統計ダッシュボード' },
  { href: '/admin/settings', label: '隠された章 設定' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-primary text-primary">
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-10">
        <aside className="w-56 rounded-3xl border border-accent/30 bg-card/80 p-5 shadow-library-card">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">Admin</p>
          <h2 className="mt-2 text-xl font-semibold">来世ガチャ管理</h2>
          <nav className="mt-6 flex flex-col gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl px-3 py-2 text-sm text-primary transition hover:bg-[#222222]/50"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 rounded-3xl border border-accent/25 bg-card/70 p-6 shadow-library-card">{children}</main>
      </div>
    </div>
  );
}
