import Link from 'next/link';

import { requestPasswordReset } from '@/app/(auth)/actions';

type ResetPageProps = {
  searchParams?: Promise<{ status?: string }>;
};

const statusMessages: Record<string, { text: string; tone: 'success' | 'error' }> = {
  sent: { text: 'パスワード再設定リンクを送信しました。メールをご確認ください。', tone: 'success' },
  invalid: { text: 'メールアドレスの形式が正しくありません。', tone: 'error' },
};

export default async function ResetPage({ searchParams }: ResetPageProps) {
  const params = await searchParams;
  const message = params?.status ? statusMessages[params.status] : null;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-10">
      <div className="rounded-3xl border border-white/10 bg-black/30 px-6 py-8 text-center shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-yellow">SECURITY</p>
        <h1 className="mt-2 font-display text-4xl text-white">パスワード再設定</h1>
        <p className="mt-2 text-sm text-white/70">
          登録メールアドレスを入力すると、再設定用のリンクをお送りします。メール内のボタンを押すだけで新しいパスワードを登録できます。
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
        action={requestPasswordReset}
        className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-panel-inset"
      >
        <h2 className="text-xl font-semibold text-white">メールアドレスを入力してください</h2>
        <p className="mt-2 text-sm text-white/60">
          送信されたメールのリンクから、新しいパスワードを1ステップで登録できます。リンクの有効期限は1時間です。
        </p>
        <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.4em] text-white/50">
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
          再設定リンクを送信
        </button>
        <p className="mt-4 text-center text-xs text-white/50">
          メールが届かない場合は迷惑メールフォルダをご確認ください。
        </p>
      </form>

      <p className="text-center text-sm text-white/60">
        すでに再設定リンクをお持ちの場合は、メール内のボタンから直接 <Link href="/reset/complete" className="underline underline-offset-4">新しいパスワードを登録</Link> できます。
      </p>
    </section>
  );
}
