import Link from 'next/link';
import { enterNeonHall } from '@/app/(auth)/actions';

export default function LoginPage() {
  return (
    <form action={enterNeonHall} className="space-y-8">
      <div className="text-center space-y-3">
        <p className="text-[11px] uppercase tracking-[0.55em] text-neon-yellow">Welcome</p>
        <h1 className="font-display text-4xl">転生ホール 入場</h1>
        <p className="text-sm text-white/70">尊師ガチャと同じく、入場するとチケットホールへ案内します。</p>
      </div>
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.35em] text-white/60">メールアドレス (任意)</label>
          <input
            type="email"
            name="email"
            placeholder="coming soon"
            disabled
            className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-white placeholder-white/30"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.35em] text-white/60">パスワード (任意)</label>
          <input
            type="password"
            name="password"
            placeholder="coming soon"
            disabled
            className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-white placeholder-white/30"
          />
        </div>
      </div>
      <button
        type="submit"
        className="w-full rounded-full bg-gradient-to-r from-[#ff2d95] via-[#ff8c3a] to-[#fff65c] py-3 text-sm font-semibold uppercase tracking-[0.35em] text-[#120714] shadow-neon"
      >
        入場する
      </button>
      <p className="text-center text-xs text-white/60">
        アカウント未所持の方は{' '}
        <Link href="/register" className="text-neon-blue underline">
          新規登録 (準備中)
        </Link>
      </p>
    </form>
  );
}
