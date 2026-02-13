import Link from 'next/link';

import { registerLibraryMember } from '@/app/(auth)/actions';

type RegisterPageProps = {
  searchParams?: { error?: string };
};

const inputClassName =
  'mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-neon-blue focus:outline-none';

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  const error = searchParams?.error;

  return (
    <section className="space-y-8">
      <div className="space-y-2 text-center">
        <p className="text-[11px] uppercase tracking-[0.55em] text-neon-blue">RAISE GACHA</p>
        <h1 className="font-display text-4xl text-white">RAISE GACHA</h1>
        <p className="text-sm text-zinc-300">来世ガチャへようこそ</p>
      </div>

      <div className="space-y-6 rounded-3xl border border-white/10 bg-black/30 p-6 shadow-[0_25px_45px_rgba(0,0,0,0.45)]">
        <div>
          <p className="text-[11px] uppercase tracking-[0.45em] text-neon-yellow">Entry Ticket</p>
          <h2 className="mt-2 font-display text-2xl text-white">アカウント作成</h2>
          <p className="text-sm text-zinc-400">メール認証後にホールへ入場できます。</p>
        </div>

        <form action={registerLibraryMember} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-[0.35em] text-zinc-400">Email</label>
            <input type="email" name="email" required className={inputClassName} placeholder="user@example.com" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.35em] text-zinc-400">Password</label>
            <input
              type="password"
              name="password"
              minLength={8}
              required
              className={inputClassName}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.35em] text-zinc-400">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              minLength={8}
              required
              className={inputClassName}
              placeholder="••••••••"
            />
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-zinc-300">
            <input type="checkbox" name="acceptTerms" value="true" required className="h-4 w-4 accent-neon-yellow" />
            利用規約とプライバシーポリシーに同意します
          </label>

          {error && (
            <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">{error}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-full bg-gradient-to-r from-[#ff2d95] via-[#ff8c3a] to-[#fff65c] py-3 font-display text-sm tracking-[0.35em] text-[#120714] shadow-[0_0_28px_rgba(255,246,92,0.6)] transition hover:brightness-105"
          >
            CREATE
          </button>
        </form>

        <p className="text-center text-xs text-zinc-400">
          既にアカウントをお持ちですか？{' '}
          <Link href="/login" className="text-neon-yellow">
            ログインする
          </Link>
        </p>
      </div>
    </section>
  );
}
