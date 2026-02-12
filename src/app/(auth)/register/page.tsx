import Link from 'next/link';
import { registerLibraryMember } from '@/app/(auth)/actions';

type RegisterPageProps = {
  searchParams?: { error?: string };
};

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  const error = searchParams?.error;

  return (
    <form action={registerLibraryMember} className="space-y-6 text-library-text-primary">
      <div className="space-y-2 text-center">
        <p className="font-accent text-xs uppercase tracking-[0.45em] text-library-accent">Admission</p>
        <h1 className="font-serif text-3xl">入館証の発行</h1>
        <p className="text-sm text-library-text-secondary">
          必要事項を記入すると、すぐに輪廻の書庫へアクセスできます。
        </p>
      </div>

      <div className="space-y-4">
        <label className="text-left text-sm">
          <span className="text-xs uppercase tracking-[0.35em] text-library-text-secondary">お名前</span>
          <input
            type="text"
            name="displayName"
            required
            className="mt-1 w-full rounded-2xl border border-library-accent/20 bg-library-primary/60 px-4 py-3 text-library-secondary"
          />
        </label>
        <label className="text-left text-sm">
          <span className="text-xs uppercase tracking-[0.35em] text-library-text-secondary">メールアドレス</span>
          <input
            type="email"
            name="email"
            required
            className="mt-1 w-full rounded-2xl border border-library-accent/20 bg-library-primary/60 px-4 py-3 text-library-secondary"
          />
        </label>
        <label className="text-left text-sm">
          <span className="text-xs uppercase tracking-[0.35em] text-library-text-secondary">パスワード</span>
          <input
            type="password"
            name="password"
            minLength={8}
            required
            className="mt-1 w-full rounded-2xl border border-library-accent/20 bg-library-primary/60 px-4 py-3 text-library-secondary"
          />
        </label>
      </div>

      {error && <p className="text-center text-sm text-library-warning">{error}</p>}

      <button type="submit" className="library-button w-full">
        入館証を発行する
      </button>

      <p className="text-center text-sm text-library-text-secondary">
        すでに入館証をお持ちの方は <Link href="/login" className="text-library-accent underline">こちら</Link>
      </p>
    </form>
  );
}
