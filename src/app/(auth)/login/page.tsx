import Link from 'next/link';
import type { Metadata } from 'next';

import { loginLibraryMember, resendVerificationEmail } from '@/app/(auth)/actions';

type LoginPageProps = {
  searchParams?: { error?: string; resend?: string };
};

export const metadata: Metadata = {
  title: 'ホール入場 - 尊師ガチャ',
};

const inputClassName =
  'mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-neon-blue focus:outline-none';

const resendMessages: Record<string, { text: string; variant: 'error' | 'success' }> = {
  invalid: { text: 'メールアドレスをご確認ください。', variant: 'error' },
  missing: { text: '登録済みのメールアドレスを入力してください。', variant: 'error' },
  sent: { text: '認証メールを送信しました。', variant: 'success' },
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const error = searchParams?.error;
  const resend = searchParams?.resend ? resendMessages[searchParams.resend] : null;

  return (
    <section className="space-y-8">
      <div className="space-y-2 text-center">
        <p className="text-[11px] uppercase tracking-[0.55em] text-neon-blue">SONSHI GACHA</p>
        <h1 className="font-display text-4xl text-white">SONSHI GACHA</h1>
        <p className="text-sm text-zinc-300">尊師ガチャへようこそ</p>
      </div>

      <div className="space-y-6 rounded-3xl border border-white/10 bg-black/30 p-6 shadow-[0_25px_45px_rgba(0,0,0,0.45)]">
        <div>
          <p className="text-[11px] uppercase tracking-[0.45em] text-neon-yellow">Entrance</p>
          <h2 className="mt-2 font-display text-2xl text-white">ホール入場</h2>
          <p className="text-sm text-zinc-400">登録メールアドレスでログインしてください。</p>
        </div>

        <form action={loginLibraryMember} className="space-y-4">
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

          {error && (
            <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">{error}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-full bg-gradient-to-r from-[#ff2d95] via-[#ff8c3a] to-[#fff65c] py-3 font-display text-sm tracking-[0.35em] text-[#120714] shadow-[0_0_28px_rgba(255,246,92,0.6)] transition hover:brightness-105"
          >
            SIGN IN
          </button>
        </form>
      </div>

      <div className="space-y-3 rounded-3xl border border-white/10 bg-black/25 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-neon-blue">メールが届いていませんか？</p>
          <p className="mt-1 text-xs text-zinc-400">登録済みアドレスへ認証メールを再送します。</p>
        </div>
        <form action={resendVerificationEmail} className="space-y-3">
          <div>
            <label className="text-[11px] uppercase tracking-[0.3em] text-zinc-400">Email</label>
            <input type="email" name="email" required className={inputClassName} placeholder="user@example.com" />
          </div>
          {resend && (
            <p
              className={`rounded-2xl border px-4 py-2 text-xs ${
                resend.variant === 'success'
                  ? 'border-neon-blue/30 bg-neon-blue/10 text-neon-blue'
                  : 'border-red-500/30 bg-red-500/10 text-red-200'
              }`}
            >
              {resend.text}
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-full border border-white/20 py-3 text-[11px] uppercase tracking-[0.35em] text-white transition hover:border-neon-blue"
          >
            認証メールを再送
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-2 text-center text-xs text-zinc-400">
        <Link href="/register" className="text-neon-yellow">
          アカウントを作成
        </Link>
        <Link href="/reset" className="text-neon-blue">
          パスワードをお忘れの方はこちら
        </Link>
      </div>
    </section>
  );
}
