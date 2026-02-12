import Link from 'next/link';
import { exitNeonHall } from '@/app/(auth)/actions';
import { fetchExistingSession } from '@/lib/app/session';

const MENU_ITEMS = [
  { label: '物語の記録', description: '開いた本の履歴', href: '/mypage/tickets' },
  { label: '栞の管理', description: '栞の購入と補充', href: '/purchase' },
  { label: '招待状', description: '友人へ書庫を案内', href: '/social' },
];

export default async function MyPage() {
  const session = await fetchExistingSession();
  const joinedAt = session?.created_at ? new Date(session.created_at).toLocaleDateString('ja-JP') : '---';
  const sessionCode = session?.id ? `#${session.id.slice(0, 8)}` : '---';

  return (
    <section className="space-y-6 text-library-text-primary">
      <div className="space-y-2 text-center">
        <p className="font-accent text-xs uppercase tracking-[0.45em] text-library-accent">Study</p>
        <h1 className="font-serif text-3xl">書斎</h1>
        <p className="text-sm text-library-text-secondary">あなたの来世アカウントと、書庫の各種メニューをまとめました。</p>
      </div>

      <div className="library-card space-y-2">
        <p className="text-xs uppercase tracking-[0.35em] text-library-accent">入館証</p>
        <p className="font-serif text-xl">匿名来訪者</p>
        <p className="text-sm text-library-text-secondary">登録日: {joinedAt}</p>
        <p className="text-xs text-library-text-secondary">Session ID: {sessionCode}</p>
      </div>

      <div className="library-card space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-library-accent">メニュー</p>
        <div className="space-y-2">
          {MENU_ITEMS.map((item) => (
            <Link key={item.label} href={item.href} className="flex items-center justify-between rounded-2xl border border-library-accent/15 bg-library-primary/60 px-4 py-3">
              <div>
                <p className="font-serif text-base">{item.label}</p>
                <p className="text-xs text-library-text-secondary">{item.description}</p>
              </div>
              <span className="font-accent text-sm text-library-accent">開く</span>
            </Link>
          ))}
        </div>
      </div>

      <form action={exitNeonHall} className="space-y-2">
        <button type="submit" className="library-button w-full">
          書庫から退出
        </button>
        <p className="text-center text-xs text-library-text-secondary">退出すると再びログインページへ戻ります。</p>
      </form>
    </section>
  );
}
