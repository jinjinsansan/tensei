import Link from 'next/link';
import { enterNeonHall } from '@/app/(auth)/actions';

export default function LoginPage() {
  return (
    <form action={enterNeonHall} className="space-y-8 text-library-text-primary">
      <div className="space-y-2 text-center">
        <p className="font-accent text-xs uppercase tracking-[0.45em] text-library-accent">Entrance</p>
        <h1 className="font-serif text-3xl">書庫への入館</h1>
        <p className="text-sm text-library-text-secondary">メール認証は準備中です。いまは仮の入館証で体験いただけます。</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-[0.35em] text-library-text-secondary">メールアドレス</label>
          <input
            type="email"
            name="email"
            placeholder="coming soon"
            disabled
            className="w-full rounded-2xl border border-library-accent/20 bg-library-primary/60 px-4 py-3 text-library-secondary placeholder:text-library-text-secondary"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-[0.35em] text-library-text-secondary">パスワード</label>
          <input
            type="password"
            name="password"
            placeholder="coming soon"
            disabled
            className="w-full rounded-2xl border border-library-accent/20 bg-library-primary/60 px-4 py-3 text-library-secondary placeholder:text-library-text-secondary"
          />
        </div>
      </div>

      <button type="submit" className="library-button w-full">
        書庫に入る
      </button>
      <p className="text-center text-sm text-library-text-secondary">
        入館証をお持ちでない方は{' '}
        <Link href="/register" className="text-library-accent underline">
          発行ページへ
        </Link>
      </p>
    </form>
  );
}
