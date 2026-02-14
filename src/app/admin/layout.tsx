export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getServiceSupabase } from "@/lib/supabase/service";

const links = [
  { href: '/admin', label: 'ダッシュボード' },
  { href: '/admin/characters', label: 'キャラクター管理' },
  { href: '/admin/cards', label: 'カード管理' },
  { href: '/admin/scenarios', label: 'シナリオ管理' },
  { href: '/admin/settings', label: 'RTP設定' },
  { href: '/admin/presentation', label: '演出確率設定' },
  { href: '/admin/countdown-patterns', label: 'カウントダウンパターン' },
  { href: '/admin/stats', label: '統計' },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = getServiceSupabase();
  const { data } = await supabase.auth.getUser();

  // 認証チェック - 未ログインの場合はログインページへリダイレクト
  if (!data.user) {
    redirect('/admin/login');
  }
  return (
    <div className="min-h-screen bg-primary text-primary">
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-10">
        <aside className="w-56 space-y-4 rounded-3xl border border-accent/30 bg-card/80 p-5 shadow-library-card">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">Admin</p>
            <h2 className="mt-2 text-xl font-semibold">来世ガチャ管理</h2>
            {data.user && (
              <p className="mt-2 text-xs text-slate-400 truncate">{data.user.email}</p>
            )}
          </div>
          <nav className="flex flex-col gap-2">
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
          <form action="/admin/logout" method="POST" className="pt-4 border-t border-white/10">
            <button
              type="submit"
              className="w-full rounded-2xl bg-red-500/20 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/30"
            >
              ログアウト
            </button>
          </form>
        </aside>
        <main className="flex-1 rounded-3xl border border-accent/25 bg-card/70 p-6 shadow-library-card">{children}</main>
      </div>
    </div>
  );
}
