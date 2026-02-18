import Link from 'next/link';

import { requestPasswordReset, completePasswordReset } from '@/app/(auth)/actions';

type ResetPageProps = {
  searchParams?: Promise<{ status?: string; token?: string }>;
};

const statusMessages: Record<string, { text: string; tone: 'success' | 'error' }> = {
  sent: { text: 'パスワード再設定リンクを送信しました。メールをご確認ください。', tone: 'success' },
  invalid: { text: 'メールアドレスの形式が正しくありません。', tone: 'error' },
  'token-error': { text: '再設定リンクが無効です。もう一度お試しください。', tone: 'error' },
  'token-expired': { text: '再設定リンクの有効期限が切れています。', tone: 'error' },
};

export default async function ResetPage({ searchParams }: ResetPageProps) {
  const params = await searchParams;
  const message = params?.status ? statusMessages[params.status] : null;
  const token = params?.token ?? '';

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 py-10">
      <div className="rounded-3xl border border-white/10 bg-black/30 px-6 py-8 text-center shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-yellow">SECURITY</p>
        <h1 className="mt-2 font-display text-4xl text-white">パスワード再設定</h1>
        <p className="mt-2 text-sm text-white/70">登録メール宛に届くリンクから、暗号化されたパスワードを更新できます。</p>
      </div>

      {message && (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            message.tone === 'success'
              ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100'
              : 'border-red-400/40 bg-red-400/10 text-red-100'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <form action={requestPasswordReset} className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-panel-inset">
          <h2 className="text-xl font-semibold text-white">1. リンクを受け取る</h2>
          <p className="mt-2 text-sm text-white/60">登録メールアドレスを入力すると、再設定用リンクが届きます。</p>
          <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.4em] text-white/50">
            EMAIL
            <input
              type="email"
              name="email"
              required
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-white"
              placeholder="you@example.com"
            />
          </label>
          <button
            type="submit"
            className="mt-4 w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/20"
          >
            リンクを送信
          </button>
        </form>

        <form action={completePasswordReset} className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-panel-inset">
          <h2 className="text-xl font-semibold text-white">2. 新しいパスワードを設定</h2>
          <p className="mt-2 text-sm text-white/60">メールに記載されたトークンを用意し、8文字以上の新パスワードを入力します。</p>
          <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.4em] text-white/50">
            TOKEN
            <input
              type="text"
              name="token"
              required
              defaultValue={token}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-white"
              placeholder="メールに記載の文字列"
            />
          </label>
          <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.4em] text-white/50">
            NEW PASSWORD
            <input
              type="password"
              name="password"
              required
              minLength={8}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-white"
            />
          </label>
          <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.4em] text-white/50">
            CONFIRM
            <input
              type="password"
              name="confirmPassword"
              required
              minLength={8}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-white"
            />
          </label>
          <button
            type="submit"
            className="mt-4 w-full rounded-2xl border border-neon-yellow/40 bg-gradient-to-r from-neon-yellow/20 to-neon-pink/20 px-4 py-3 font-semibold text-white transition hover:opacity-90"
          >
            パスワードを更新
          </button>
          <p className="mt-4 text-center text-xs text-white/50">
            <Link href="/login" className="underline underline-offset-4">
              ログインへ戻る
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
