import Link from 'next/link';

export default function MyPage() {
  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-white/10 bg-black/30 p-6 shadow-panel-inset">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">My Page</p>
        <h1 className="mt-2 font-display text-3xl text-white">マイページ</h1>
        <p className="text-sm text-white/70">ログイン、プロフィール連携などの尊師導線を今後統合します。</p>
      </div>
      <div className="space-y-3">
        <Link
          href="/mypage/tickets"
          className="flex items-center justify-between rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white shadow-panel-inset"
        >
          <span>チケット履歴</span>
          <span className="text-xs uppercase tracking-[0.4em] text-white/60">OPEN</span>
        </Link>
      </div>
    </section>
  );
}
