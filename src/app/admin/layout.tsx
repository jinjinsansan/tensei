export const dynamic = "force-dynamic";

import Link from "next/link";
import type { ReactNode } from "react";

const links = [
  { href: "/admin", label: "ダッシュボード" },
  { href: "/admin/characters", label: "キャラクター" },
  { href: "/admin/cards", label: "カード" },
  { href: "/admin/scenarios", label: "シナリオ" },
  { href: "/admin/settings", label: "ガチャ設定" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-10">
        <aside className="w-56 rounded-3xl bg-white/5 p-5">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Admin</p>
          <h2 className="mt-2 text-xl font-semibold">転生ガチャ管理</h2>
          <nav className="mt-6 flex flex-col gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl px-3 py-2 text-sm text-white/80 transition hover:bg-white/10"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 rounded-3xl bg-white/5 p-6 shadow-2xl">{children}</main>
      </div>
    </div>
  );
}
