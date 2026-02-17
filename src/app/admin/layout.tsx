export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getServiceSupabase } from "@/lib/supabase/service";
import { getUserFromSession } from "@/lib/data/session";

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
  const user = await getUserFromSession(supabase);

  // 認証チェック - 未ログインまたは管理者でない場合はログインページへリダイレクト
  if (!user || !user.is_admin) {
    redirect('/login-admin');
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#03060f] via-[#02030a] to-black text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 lg:flex-row lg:gap-8 lg:px-6">
        <aside className="flex flex-col gap-4 rounded-3xl border border-white/12 bg-white/[0.04] p-6 shadow-[0_25px_90px_rgba(0,0,0,0.55)] backdrop-blur lg:w-64">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">Admin</p>
            <h2 className="text-2xl font-semibold text-white">来世ガチャ管理</h2>
            <p className="text-xs text-white/60 truncate">{user.email}</p>
          </div>
          <nav className="flex flex-col gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white/80 transition hover:border-white/40 hover:bg-white/10"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <form action="/admin/logout" method="POST" className="pt-4">
            <button
              type="submit"
              className="w-full rounded-2xl border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm font-semibold text-red-200 transition hover:border-red-300/60 hover:bg-red-400/20"
            >
              ログアウト
            </button>
          </form>
        </aside>
        <main className="flex-1 space-y-6">{children}</main>
      </div>
    </div>
  );
}
