"use client";

import Image from 'next/image';
import Link from 'next/link';
import { LoginBonusCard } from '@/components/home/login-bonus-card';
import { TicketBalanceCarousel } from '@/components/home/ticket-balance-carousel';
import { useMainApp } from '@/components/providers/main-app-provider';
import { GACHA_DEFINITIONS } from '@/constants/gacha';
import { useLoginBonus } from '@/hooks/use-login-bonus';

const RARITY_LABELS = ['N', 'R', 'SR', 'SSR', 'UR'];

function formatRarity(range: [number, number]) {
  const label = (value: number) => RARITY_LABELS[value - 1] ?? `★${value}`;
  return `${label(range[0])}〜${label(range[1])}`;
}

export function HomeDashboard() {
  const { snapshot } = useMainApp();
  const tickets = snapshot.tickets.length > 0 ? snapshot.tickets : [];
  const tiers = snapshot.gachaCatalog.length > 0 ? snapshot.gachaCatalog : GACHA_DEFINITIONS;
  const loginBonus = useLoginBonus();

  return (
    <section className="mx-auto w-full max-w-md space-y-10">
      <div className="space-y-2 text-center">
        <div className="relative inline-block">
          <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-pink-500/15 blur-2xl" />
          <h1 className="relative font-display text-5xl font-bold tracking-[0.05em] text-transparent bg-gradient-to-r from-[#fff65c] via-[#ff9b3d] to-[#ff2d95] bg-clip-text drop-shadow-[0_0_50px_rgba(255,246,92,0.8)] drop-shadow-[0_0_90px_rgba(255,157,61,0.6)] drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
            チケットホール
          </h1>
        </div>
        <p className="text-sm text-white/75">チケットを購入してガチャを回そう</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <div className="space-y-1">
            <p className="uppercase tracking-[0.4em] text-neon-yellow">Tickets</p>
            <p>本日のチケット残高</p>
          </div>
          <Link href="/mypage/tickets" className="text-xs uppercase tracking-[0.35em] text-neon-blue">
            履歴を見る
          </Link>
        </div>
        <TicketBalanceCarousel tickets={tickets} />
      </section>

      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">Login Bonus</p>
        <LoginBonusCard state={loginBonus.state} claiming={loginBonus.claiming} onClaim={loginBonus.claim} />
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">Ticket Inventory</p>
          <h2 className="font-display text-2xl text-white">保有チケット</h2>
        </div>
        <div className="space-y-4">
          {tiers.map((tier) => (
            <article
              key={tier.id}
              className={`relative overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-br ${tier.gradient} p-6 shadow-panel-inset`}
            >
              <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_60%)]" />
              <div className="absolute inset-0 border border-white/10" />
              <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-4">
                  <p className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-white/80">
                    {tier.ticketLabel}
                  </p>
                  <h3 className="font-display text-2xl text-white">{tier.name}ガチャ</h3>
                  <p className="text-sm leading-relaxed text-white/85">{tier.description}</p>
                  <div className="flex items-center gap-3 text-[0.65rem] text-white/80">
                    <span className="rounded-full border border-white/20 px-3 py-1 uppercase tracking-[0.35em]">
                      {formatRarity(tier.rarityRange)}
                    </span>
                    <span className="rounded-full border border-white/10 px-3 py-1 uppercase tracking-[0.35em]">{tier.priceLabel}</span>
                  </div>
                  {tier.featuredNote && (
                    <p className="text-[11px] uppercase tracking-[0.35em] text-yellow-200">{tier.featuredNote}</p>
                  )}
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="relative h-20 w-32">
                    <Image
                      src={`/ticket-illustration${tier.id === 'free' ? '' : `-${tier.id === 'ex' ? 'vip' : tier.id}`}.svg`}
                      alt={`${tier.name} ticket`}
                      fill
                      sizes="128px"
                      className="object-contain drop-shadow-[0_25px_35px_rgba(0,0,0,0.45)]"
                    />
                  </div>
                  <Link
                    href="/gacha"
                    className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-[0.7rem] uppercase tracking-[0.35em] text-white/85 transition hover:border-neon-yellow hover:text-white"
                  >
                    ガチャへ
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Link
        href="/mypage/tickets"
        className="flex h-14 items-center justify-center rounded-full bg-[#ffe347] text-sm font-semibold uppercase tracking-[0.35em] text-[#2a1000] transition hover:bg-[#ffef7a]"
      >
        チケット購入へ
      </Link>
    </section>
  );
}
