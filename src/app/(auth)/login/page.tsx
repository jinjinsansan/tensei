import Link from "next/link";
import type { Metadata } from "next";
import { loginLibraryMember, resendVerificationEmail } from "../actions";

type LoginPageParams = { error?: string; resend?: string; reset?: string };

type LoginPageProps = {
  searchParams?: Promise<LoginPageParams>;
};

export const metadata: Metadata = {
  title: "ホール入場 - 来世ガチャ",
};

const resendMessages: Record<string, { text: string; variant: "error" | "success" }> = {
  invalid: { text: "メールアドレスをご確認ください。", variant: "error" },
  missing: { text: "登録済みのメールアドレスを入力してください。", variant: "error" },
  sent: { text: "認証メールを送信しました。", variant: "success" },
};

const resetMessages: Record<string, { text: string; variant: "error" | "success" }> = {
  done: { text: "パスワードを更新しました。新しい情報でサインインしてください。", variant: "success" },
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const error = params.error;
  const resend = params.resend ? resendMessages[params.resend] : null;
  const reset = params.reset ? resetMessages[params.reset] : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.5em] text-neon-blue">Entrance</p>
        <h1 className="mt-2 font-display text-3xl text-white">ホール入場</h1>
        <p className="text-sm text-zinc-400">登録メールアドレスでログインしてください。</p>
      </div>

      <form action={loginLibraryMember} className="space-y-4">
        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-zinc-400">Email</label>
          <input
            name="email"
            type="email"
            required
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-neon-blue"
            placeholder="user@example.com"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-zinc-400">Password</label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-neon-blue"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
            {error}
          </p>
        )}
        {reset && (
          <p
            className={`rounded-xl border px-4 py-2 text-sm ${
              reset.variant === "success"
                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                : "border-red-500/30 bg-red-500/10 text-red-200"
            }`}
          >
            {reset.text}
          </p>
        )}

        <button
          type="submit"
          className="mt-4 w-full rounded-full bg-gradient-to-r from-[#ff2d95] via-[#ff8c3a] to-[#fff65c] py-3 font-display text-sm tracking-[0.35em] text-[#120714] shadow-[0_0_28px_rgba(255,246,92,0.6)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fff65c]/70"
        >
          SIGN IN
        </button>
      </form>

      <form action={resendVerificationEmail} className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-left">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-neon-blue">メールが届いていませんか？</p>
          <p className="mt-1 text-xs text-zinc-400">登録済みアドレスへ認証メールを再送します。</p>
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-[0.3em] text-zinc-400">Email</label>
          <input
            name="email"
            type="email"
            required
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-neon-blue"
            placeholder="user@example.com"
          />
        </div>
        {resend && (
          <p
            className={`rounded-xl border px-4 py-2 text-xs ${
              resend.variant === "success"
                ? "border-neon-blue/30 bg-neon-blue/10 text-neon-blue"
                : "border-red-500/30 bg-red-500/10 text-red-200"
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

      <div className="flex flex-col gap-2 text-center text-xs text-zinc-400">
        <Link href="/register" className="text-neon-yellow">
          アカウントを作成
        </Link>
        <Link href="/reset" className="text-neon-blue">
          パスワードをお忘れの方はこちら
        </Link>
      </div>
    </div>
  );
}
