import Image from 'next/image';
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
  'mt-2 w-full rounded-2xl border border-white/15 bg-[rgba(7,5,20,0.65)] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-neon-blue focus:outline-none';

const resendMessages: Record<string, { text: string; variant: 'error' | 'success' }> = {
  invalid: { text: 'メールアドレスをご確認ください。', variant: 'error' },
  missing: { text: '登録済みのメールアドレスを入力してください。', variant: 'error' },
  sent: { text: '認証メールを送信しました。', variant: 'success' },
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const error = searchParams?.error;
  const resend = searchParams?.resend ? resendMessages[searchParams.resend] : null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050014]">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,45,149,0.4),transparent_55%),radial-gradient(circle_at_85%_20%,rgba(48,240,255,0.45),transparent_55%),radial-gradient(circle_at_50%_90%,rgba(255,246,92,0.25),transparent_60%),linear-gradient(135deg,#050014,#130532,#03010f)]" />
        <div className="absolute inset-0 bg-hall-grid opacity-25" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px)] opacity-20" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl space-y-6 rounded-[36px] border border-white/12 bg-[rgba(6,4,18,0.92)] p-8 shadow-[0_35px_120px_rgba(0,0,0,0.8)] backdrop-blur-[22px]">
          <div className="space-y-3 text-center">
            <p className="text-[11px] uppercase tracking-[0.55em] text-neon-blue">SONSHI GACHA</p>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/5">
              <Image src="/raise-gacha-logo.png" alt="来世ガチャ ロゴ" width={48} height={48} className="h-12 w-12 object-contain" />
            </div>
            <h1 className="font-display text-4xl text-white">尊師ガチャへようこそ</h1>
            <p className="text-sm text-zinc-400">ホール入場</p>
          </div>

          <div className="space-y-5 rounded-[28px] border border-white/10 bg-gradient-to-b from-white/4 to-white/0 px-6 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
            <p className="text-[11px] uppercase tracking-[0.45em] text-neon-yellow">Entrance</p>
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
                className="w-full rounded-full bg-gradient-to-r from-[#ff2d95] via-[#ff8c3a] to-[#fff65c] py-3 font-display text-sm tracking-[0.35em] text-[#120714] shadow-[0_0_32px_rgba(255,246,92,0.65)] transition hover:brightness-105"
              >
                SIGN IN
              </button>
            </form>
          </div>

          <div className="space-y-3 rounded-[28px] border border-white/10 bg-[rgba(4,3,15,0.85)] px-6 py-6 shadow-[0_12px_30px_rgba(0,0,0,0.4)]">
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
        </div>
      </div>
    </div>
  );
}
