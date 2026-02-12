"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoginBonusCard } from '@/components/home/login-bonus-card';
import { TicketBalanceCarousel } from '@/components/home/ticket-balance-carousel';
import { useMainApp } from '@/components/providers/main-app-provider';
import { GACHA_DEFINITIONS } from '@/constants/gacha';
import { useLoginBonus } from '@/hooks/use-login-bonus';

export function HomeDashboard() {
  const { snapshot } = useMainApp();
  const router = useRouter();
  const tickets = snapshot.tickets.length > 0 ? snapshot.tickets : [];
  const tiers = snapshot.gachaCatalog.length > 0 ? snapshot.gachaCatalog : GACHA_DEFINITIONS;
  const loginBonus = useLoginBonus();

  const featuredStories = tiers.slice(0, 3).map((tier) => ({
    id: tier.id,
    title: `${tier.name}の物語`,
    rarity: `★${tier.rarityRange[0]}〜★${tier.rarityRange[1]}`,
  }));

  return (
    <section className="space-y-10 text-library-text-primary">
      <div className="space-y-3 text-center">
        <p className="font-accent text-xs uppercase tracking-[0.45em] text-library-accent">Archives</p>
        <h1 className="font-serif text-3xl text-library-text-primary">書庫入口</h1>
        <p className="text-sm text-library-text-secondary">ここから輪廻の書庫へ。栞を揃え、物語の扉を開いてください。</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between text-sm text-library-text-secondary">
          <div>
            <p className="text-xs tracking-[0.35em] text-library-accent">日替わりの栞</p>
            <p>今日はどんな栞が届くでしょう？</p>
          </div>
          <span className="text-xs font-accent tracking-[0.3em] text-library-accent">Daily</span>
        </div>
        <LoginBonusCard state={loginBonus.state} claiming={loginBonus.claiming} onClaim={loginBonus.claim} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-library-accent">栞の残高</p>
            <p className="text-sm text-library-text-secondary">手元の栞を確認しましょう</p>
          </div>
          <Link href="/mypage/tickets" className="text-xs font-accent tracking-[0.3em] text-library-accent">
            栞の記録
          </Link>
        </div>
        <TicketBalanceCarousel tickets={tickets} />
      </section>

      <section className="library-card space-y-4">
        <div className="space-y-1">
          <p className="text-xs tracking-[0.35em] text-library-accent">閲覧室</p>
          <h2 className="font-serif text-2xl text-library-secondary">「次の物語を開きましょう」</h2>
          <p className="text-sm text-library-text-secondary">栞を差し込み、本を開けばあなたの来世が流れ込んできます。</p>
        </div>
        <button type="button" className="library-button w-full" onClick={() => router.push('/gacha')}>
          閲覧室へ進む
        </button>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between text-library-text-secondary">
          <p className="font-serif text-lg text-library-text-primary">最近の物語</p>
          <span className="text-xs tracking-[0.3em] text-library-accent">NEW</span>
        </div>
        <div className="space-y-2">
          {featuredStories.map((story) => (
            <div key={story.id} className="flex items-center justify-between rounded-xl border border-library-accent/20 bg-library-primary/40 px-4 py-3">
              <div>
                <p className="font-serif text-base text-library-secondary">{story.title}</p>
                <p className="text-xs text-library-text-secondary">{story.rarity}</p>
              </div>
              <span className="font-accent text-sm text-library-accent">開架中</span>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
