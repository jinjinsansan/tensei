import Link from 'next/link';
import type { Metadata } from 'next';
import { loginLibraryMember } from '@/app/(auth)/actions';

type LoginPageProps = {
  searchParams?: { error?: string };
};

export const metadata: Metadata = {
  title: '書庫への入館 - 来世ガチャ',
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const error = searchParams?.error;

  return (
    <form action={loginLibraryMember} className="space-y-8 text-primary">
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.45em] text-accent">Entrance</p>
        <h1 className="text-3xl font-bold">書庫への入館</h1>
        <p className="text-sm text-secondary">登録済みの入館証を入力して書庫へお入りください。</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-[0.35em] text-secondary">メールアドレス</label>
          <input
            type="email"
            name="email"
            required
            className="w-full rounded-2xl border border-accent/20 bg-card/60 px-4 py-3 text-primary placeholder:text-secondary"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-[0.35em] text-secondary">パスワード</label>
          <input
            type="password"
            name="password"
            minLength={8}
            required
            className="w-full rounded-2xl border border-accent/20 bg-card/60 px-4 py-3 text-primary placeholder:text-secondary"
          />
        </div>
      </div>

      {error && <p className="text-center text-sm text-accent">{error}</p>}

      <button type="submit" className="library-button w-full">
        書庫に入る
      </button>
      <p className="text-center text-sm text-secondary">
        入館証をお持ちでない方は{' '}
        <Link href="/register" className="text-accent underline">
          発行ページへ
        </Link>
      </p>
    </form>
  );
}
