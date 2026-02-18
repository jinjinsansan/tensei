import Link from 'next/link';

import { completePasswordReset } from '@/app/(auth)/actions';

type ResetCompletePageProps = {
  searchParams?: Promise<{ status?: string; token?: string }>;
};

const statusMessages: Record<string, { text: string; tone: 'success' | 'error' }> = {
  'token-error': { text: '再設定リンクが無効です。もう一度お試しください。', tone: 'error' },
  'token-expired': { text: '再設定リンクの有効期限が切れています。新しくリクエストしてください。', tone: 'error' },
};

export default async function ResetCompletePage({ searchParams }: ResetCompletePageProps) {
  const params = await searchParams;
  const token = params?.token ?? '';
  const message = params?.status ? statusMessages[params.status] : null;
  const needsTokenInput = !token;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-10">
      <div className="rounded-3xl border border-white/10 bg-black/30 px-6 py-8 text-center shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-yellow">SECURITY</p>
        <h1 className="mt-2 font-display text-4xl text-white">新しいパスワードを設定</h1>
        <p className="mt-2 text-sm text-white/70">
          メールのリンクから開くと、トークンが自動入力されます。8文字以上の新しいパスワードを登録してください。
        </p>
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

      <form
        action={completePasswordReset}
        className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-panel-inset"
      >
        <h2 className="text-xl font-semibold text-white">新しいパスワードを入力</h2>
        <p className="mt-2 text-sm text-white/60">最低8文字・英数字混在を推奨します。</p>

        {needsTokenInput ? (
          <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.4em] text-white/50">
            TOKEN
            <input
              type="text"
              name="token"
              required
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-white"
              placeholder="メールに記載のトークン"
            />
          </label>
        ) : (
          <input type="hidden" name="token" value={token} />
        )}

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
          className="mt-5 w-full rounded-2xl border border-neon-yellow/40 bg-gradient-to-r from-neon-yellow/20 to-neon-pink/20 px-4 py-3 font-semibold text-white transition hover:opacity-90"
        >
          パスワードを更新
        </button>
        <p className="mt-4 text-center text-xs text-white/50">
          リンクの有効期限が切れた場合は <Link href="/reset" className="underline underline-offset-4">再度リセットリンクを取得</Link> してください。
        </p>
      </form>
    </section>
  );
}
