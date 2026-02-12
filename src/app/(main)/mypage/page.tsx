import Link from 'next/link';
import { redirect } from 'next/navigation';
import { exitNeonHall } from '@/app/(auth)/actions';
import { fetchAuthedContext } from '@/lib/app/session';

const MENU_ITEMS = [
  { label: '物語の記録', description: '開いた本の履歴', href: '/mypage/tickets' },
  { label: '栞の管理', description: '栞の購入と補充', href: '/purchase' },
  { label: '招待状', description: '友人へ書庫を案内', href: '/social' },
];

export default async function MyPage() {
  const context = await fetchAuthedContext();
  if (!context) {
    redirect('/login');
  }
  const { session, user } = context;
  const joinedAt = user.created_at ? new Date(user.created_at).toLocaleDateString('ja-JP') : '---';
  const sessionCode = session.id ? `#${session.id.slice(0, 8)}` : '---';
  const displayName = user.display_name ?? user.email ?? '来世の旅人';

  return (
    <section className="space-y-6 text-primary">
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.45em] text-accent">Study</p>
        <h1 className="text-3xl font-bold">書斎</h1>
        <p className="text-sm text-secondary">あなたの来世アカウントと、書庫の各種メニューをまとめました。</p>
      </div>

      <div className="library-card space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">入館証</p>
        <p className="text-xl font-medium">{displayName}</p>
        <p className="text-sm text-secondary">登録日: {joinedAt}</p>
        <p className="text-xs text-secondary">Session ID: {sessionCode}</p>
      </div>

      <div className="library-card space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">メニュー</p>
        <div className="space-y-2">
          {MENU_ITEMS.map((item) => (
            <Link key={item.label} href={item.href} className="flex items-center justify-between rounded-2xl border border-accent/15 bg-card/60 px-4 py-3">
              <div>
                <p className="text-base font-medium">{item.label}</p>
                <p className="text-xs text-secondary">{item.description}</p>
              </div>
              <span className="text-sm font-semibold text-accent">開く</span>
            </Link>
          ))}
        </div>
      </div>

      <form action={exitNeonHall} className="space-y-2">
        <button type="submit" className="library-button w-full">
          書庫から退出
        </button>
        <p className="text-center text-xs text-secondary">退出すると再びログインページへ戻ります。</p>
      </form>
    </section>
  );
}
