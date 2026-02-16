import { loginAsAdmin } from './actions';

type AdminLoginPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = (await searchParams) ?? {};
  const error = params.error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-black via-zinc-950 to-black px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[rgba(10,8,18,0.95)] p-8 shadow-[0_40px_90px_rgba(0,0,0,0.85)]">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">管理者ログイン</h1>
          <p className="mt-2 text-sm text-white/60">来世ガチャ管理パネル</p>
        </div>

        <form action={loginAsAdmin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/80">
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="mt-1 w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
              placeholder="goldbenchan@gmail.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/80">
              パスワード
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              minLength={8}
              className="mt-1 w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-yellow-400 px-4 py-3 font-bold text-black transition hover:brightness-110"
          >
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
}
