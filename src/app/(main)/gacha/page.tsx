import Link from 'next/link';
import { TicketBalanceCarousel } from '@/components/home/ticket-balance-carousel';
import { GachaExperience } from '@/components/gacha/gacha-experience';
import { getSessionWithSnapshot } from '@/lib/app/session';
import type { TicketBalanceItem } from '@/lib/utils/tickets';

const FALLBACK_TICKETS: TicketBalanceItem[] = [
  { code: 'free', name: '無料の栞', quantity: 0, colorToken: 'bookmark', sortOrder: 0 },
  { code: 'basic', name: '銅の栞', quantity: 0, colorToken: 'bookmark', sortOrder: 1 },
  { code: 'epic', name: '銀の栞', quantity: 0, colorToken: 'bookmark', sortOrder: 2 },
  { code: 'premium', name: '金の栞', quantity: 0, colorToken: 'bookmark', sortOrder: 3 },
  { code: 'ex', name: '白金の栞', quantity: 0, colorToken: 'bookmark', sortOrder: 4 },
];

const UPCOMING_BOOKS = [
  {
    id: 'kanda',
    title: '神田の秘蔵書',
    description: '世紀末覇者の章。調査中。',
    status: '封印中',
  },
  {
    id: 'ayaka',
    title: '彩花の旅路',
    description: '愛と音楽の続編。準備中。',
    status: '編集中',
  },
];

export default async function GachaPage() {
  const { snapshot } = await getSessionWithSnapshot();
  const tickets = snapshot.tickets.length > 0 ? snapshot.tickets : FALLBACK_TICKETS;

  return (
    <section className="space-y-9 text-primary">
      <div className="space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.45em] text-accent">Reading Room</p>
        <h1 className="text-3xl font-bold">閲覧室</h1>
        <p className="text-sm text-secondary">読み継がれる来世の本が、ここであなたを待ち続けています。</p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">栞の残高</span>
          <Link href="/mypage/tickets" className="text-xs font-semibold tracking-[0.3em] text-accent">
            記録を開く
          </Link>
        </div>
        <TicketBalanceCarousel tickets={tickets} />
      </section>

      <article className="space-y-5 rounded-[28px] border border-accent/25 bg-card/70 p-6 shadow-library-card">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.35em] text-accent">健太の物語</p>
          <h2 className="text-2xl font-bold">健太 来世アーカイブ</h2>
          <p className="text-sm text-secondary">栞を1枚差し込み、光る本を開いてください。隠された章が現れるかもしれません。</p>
        </div>
        <div className="rounded-[22px] border border-accent/30 bg-[#120a05]/60 p-4">
          <GachaExperience />
        </div>
        <p className="text-xs text-secondary">必要な栞: 銅の栞 ×1</p>
      </article>

      <section className="space-y-3">
        <p className="text-lg font-bold text-primary">封印された本</p>
        <div className="grid gap-3">
          {UPCOMING_BOOKS.map((book) => (
            <div key={book.id} className="flex items-center justify-between rounded-2xl border border-accent/15 bg-card/60 px-4 py-3">
              <div>
                <p className="text-base font-medium">{book.title}</p>
                <p className="text-xs text-secondary">{book.description}</p>
              </div>
              <span className="text-sm font-semibold text-accent">{book.status}</span>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
