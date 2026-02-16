"use client";

import Image from "next/image";
import Link from "next/link";
import { LoginBonusCard } from "@/components/home/login-bonus-card";
import { TicketBalanceCarousel } from "@/components/home/ticket-balance-carousel";
import { useMainApp } from "@/components/providers/main-app-provider";
import { GACHA_DEFINITIONS } from "@/constants/gacha";
import { useLoginBonus } from "@/hooks/use-login-bonus";
import { canonicalizeGachaId } from "@/lib/utils/gacha";
import type { TicketBalanceItem } from "@/lib/utils/tickets";

const FALLBACK_TICKETS: TicketBalanceItem[] = [
  { code: "free", name: "フリーチケット", quantity: 0, colorToken: "neon-blue", sortOrder: 0 },
  { code: "basic", name: "ベーシックチケット", quantity: 0, colorToken: "neon-yellow", sortOrder: 1 },
  { code: "epic", name: "エピックチケット", quantity: 0, colorToken: "neon-pink", sortOrder: 2 },
  { code: "premium", name: "プレミアムチケット", quantity: 0, colorToken: "neon-purple", sortOrder: 3 },
  { code: "ex", name: "EXチケット", quantity: 0, colorToken: "glow-green", sortOrder: 4 },
];

const RARITY_LABELS = ["N", "R", "SR", "SSR", "UR"];

const TICKET_CARD_BASE = "relative overflow-hidden rounded-3xl border border-white/12 bg-black/30 p-5 shadow-panel-inset";
const TICKET_GRADIENTS: Record<string, string> = {
  free: "from-[#0b1e1a]/70 via-transparent to-transparent",
  basic: "from-[#2a1a02]/70 via-transparent to-transparent",
  epic: "from-[#2b0014]/70 via-transparent to-transparent",
  premium: "from-[#1c0030]/70 via-transparent to-transparent",
  ex: "from-[#032415]/70 via-transparent to-transparent",
};

function formatRarity(range: [number, number]) {
  const label = (value: number) => RARITY_LABELS[value - 1] ?? `★${value}`;
  return `${label(range[0])}〜${label(range[1])}`;
}

export function HomeDashboard() {
  const { snapshot } = useMainApp();
  const tickets = snapshot.tickets.length > 0 ? snapshot.tickets : FALLBACK_TICKETS;
  const tiers = snapshot.gachaCatalog.length > 0 ? snapshot.gachaCatalog : GACHA_DEFINITIONS;
  const loginBonus = useLoginBonus();

  return (
    <section className="mx-auto w-full max-w-4xl space-y-8 pb-10">
      <div className="space-y-3 rounded-3xl border border-white/10 bg-black/30 px-6 py-7 text-center shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-yellow">HOME</p>
        <h1 className="font-display text-4xl text-white">チケットホール</h1>
        <p className="text-sm text-zinc-300">チケット管理とログインリワードをここでチェック</p>
      </div>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-black/25 p-6 shadow-panel-inset">
        <div className="flex items-center justify-between text-xs text-zinc-300">
          <div className="space-y-1">
            <p className="uppercase tracking-[0.4em] text-neon-yellow">TICKETS</p>
            <p>本日のチケット残高</p>
          </div>
          <Link href="/mypage/tickets" className="text-xs uppercase tracking-[0.35em] text-neon-blue transition hover:text-white">
            履歴を見る
          </Link>
        </div>
        <TicketBalanceCarousel tickets={tickets} />
      </section>

      <section className="space-y-3 rounded-3xl border border-white/10 bg-black/25 p-6 shadow-panel-inset">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">LOGIN BONUS</p>
        <LoginBonusCard state={loginBonus.state} claiming={loginBonus.claiming} onClaim={loginBonus.claim} />
      </section>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-black/25 p-6 shadow-panel-inset">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">TICKET INVENTORY</p>
          <h2 className="font-display text-2xl text-white">保有チケット</h2>
          <p className="text-sm text-zinc-400">演出ランクごとのガチャチケット</p>
        </div>
        <div className="space-y-5">
          {tiers.map((tier) => {
            const slug = canonicalizeGachaId(tier.id) ?? tier.id;
            const ticketKey = canonicalizeGachaId(tier.ticketLabel ?? "");
            const isFreeGacha = slug === "free" || ticketKey === "free" || tier.name.includes("フリー");
            const gradient = TICKET_GRADIENTS[slug] ?? TICKET_GRADIENTS.basic;

            if (isFreeGacha) {
              return (
                <article key={tier.id} className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/30 p-5 shadow-panel-inset">
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient}`} />
                  <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="flex-1 space-y-2">
                      <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">FREE TICKET</p>
                      <h3 className="font-display text-xl text-white">フリーチケット</h3>
                      <p className="text-[0.75rem] text-white/70">ログインボーナスのチケットで挑戦できます。</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-display text-white">{loginBonus.state.quantity ?? 0}</p>
                        <span className="text-[0.7rem] text-zinc-300">LOGIN BONUS TICKETS</span>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[0.55rem] uppercase tracking-[0.4em] ${
                          loginBonus.state.claimed ? "bg-lime-300/20 text-lime-200" : "bg-amber-300/20 text-amber-200"
                        }`}
                      >
                        {loginBonus.state.claimed ? "CLAIMED" : "READY"}
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-3 lg:items-end">
                      <div className="relative h-16 w-28">
                        <Image
                          src="/ticket-illustration.svg"
                          alt="Free ticket"
                          fill
                          sizes="112px"
                          className="object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.35)]"
                        />
                      </div>
                      <Link
                        href="/gacha"
                        className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-[0.7rem] uppercase tracking-[0.35em] text-white/80 transition hover:border-neon-blue hover:text-white"
                      >
                        ガチャへ
                      </Link>
                    </div>
                  </div>
                </article>
              );
            }

            if (slug === "basic") {
              return (
                <article key={tier.id} className={TICKET_CARD_BASE}>
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient}`} />
                  <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="flex-1 space-y-2">
                      <p className="text-xs uppercase tracking-[0.4em] text-amber-300">BASIC TICKET</p>
                      <h3 className="font-display text-xl text-white">ベーシックチケット</h3>
                      <p className="text-[0.75rem] text-white/70">スタンダードなネオン演出がお楽しみいただけます。</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-display text-white">BASIC</p>
                        <span className="text-[0.7rem] text-amber-200/80">TICKET</span>
                      </div>
                      <div className="flex gap-2 text-[0.65rem] text-amber-100/90">
                        <span className="rounded-full border border-white/20 px-3 py-1 uppercase tracking-[0.35em]">
                          {formatRarity(tier.rarityRange)}
                        </span>
                        <span className="rounded-full border border-white/10 px-3 py-1 uppercase tracking-[0.35em]">BASIC</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-3 lg:items-end">
                      <div className="relative h-16 w-32">
                        <Image
                          src="/ticket-illustration-basic.svg"
                          alt="Basic ticket"
                          fill
                          sizes="128px"
                          className="object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.4)]"
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
              );
            }

            if (slug === "epic") {
              return (
                <article key={tier.id} className={TICKET_CARD_BASE}>
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient}`} />
                  <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="flex-1 space-y-2">
                      <p className="text-xs uppercase tracking-[0.4em] text-rose-200">EPIC TICKET</p>
                      <h3 className="font-display text-xl text-white">エピックチケット</h3>
                      <p className="text-[0.75rem] text-white/75">熱量が一気に上がるエピック演出。ライティングが濃い贅沢空間を再現。</p>
                      <div className="flex items-center gap-3 text-[0.65rem] text-white/80">
                        <span className="rounded-full border border-white/20 px-3 py-1 uppercase tracking-[0.35em]">
                          {formatRarity(tier.rarityRange)}
                        </span>
                        <span className="rounded-full border border-white/10 px-3 py-1 uppercase tracking-[0.35em] text-rose-200">EPIC</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative h-20 w-32">
                        <Image
                          src="/ticket-illustration-epic.svg"
                          alt="Epic ticket"
                          fill
                          sizes="128px"
                          className="object-contain drop-shadow-[0_25px_35px_rgba(0,0,0,0.45)]"
                        />
                      </div>
                      <Link
                        href="/gacha"
                        className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-[0.7rem] uppercase tracking-[0.35em] text-white/85 transition hover:border-neon-pink hover:text-white"
                      >
                        ガチャへ
                      </Link>
                    </div>
                  </div>
                </article>
              );
            }

            if (slug === "premium") {
              return (
                <article key={tier.id} className={TICKET_CARD_BASE}>
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient}`} />
                  <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="flex-1 space-y-2">
                      <p className="text-xs uppercase tracking-[0.4em] text-purple-200">PREMIUM TICKET</p>
                      <h3 className="font-display text-xl text-white">プレミアムチケット</h3>
                      <p className="text-[0.75rem] text-white/75">光と霧が交差するプレミアム演出。重厚な演出と希少カードが待っています。</p>
                      <div className="flex items-center gap-3 text-[0.65rem] text-white/80">
                        <span className="rounded-full border border-white/20 px-3 py-1 uppercase tracking-[0.35em]">
                          {formatRarity(tier.rarityRange)}
                        </span>
                        <span className="rounded-full border border-white/10 px-3 py-1 uppercase tracking-[0.35em] text-purple-200">PREMIUM</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative h-20 w-32">
                        <Image
                          src="/ticket-illustration-premium.svg"
                          alt="Premium ticket"
                          fill
                          sizes="136px"
                          className="object-contain drop-shadow-[0_28px_38px_rgba(0,0,0,0.5)]"
                        />
                      </div>
                      <Link
                        href="/gacha"
                        className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-[0.7rem] uppercase tracking-[0.35em] text-white/85 transition hover:border-neon-purple hover:text-white"
                      >
                        ガチャへ
                      </Link>
                    </div>
                  </div>
                </article>
              );
            }

            if (slug === "ex") {
              return (
                <article key={tier.id} className={TICKET_CARD_BASE}>
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient}`} />
                  <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="flex-1 space-y-2">
                      <p className="text-xs uppercase tracking-[0.4em] text-emerald-200">EX TICKET</p>
                      <h3 className="font-display text-xl text-white">EXチケット</h3>
                      <p className="text-[0.75rem] text-white/75">最上級のプライベートホール。フィナーレ演出とEXカードがここで待っています。</p>
                      <div className="flex items-center gap-3 text-[0.65rem] text-white/80">
                        <span className="rounded-full border border-white/20 px-3 py-1 uppercase tracking-[0.35em]">
                          {formatRarity(tier.rarityRange)}
                        </span>
                        <span className="rounded-full border border-white/10 px-3 py-1 uppercase tracking-[0.35em] text-emerald-200">EX</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative h-20 w-32">
                        <Image
                          src="/ticket-illustration-vip.svg"
                          alt="VIP ticket"
                          fill
                          sizes="136px"
                          className="object-contain drop-shadow-[0_32px_40px_rgba(0,0,0,0.55)]"
                        />
                      </div>
                      <Link
                        href="/gacha"
                        className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-[0.7rem] uppercase tracking-[0.35em] text-white/85 transition hover:border-green-300 hover:text-white"
                      >
                        ガチャへ
                      </Link>
                    </div>
                  </div>
                </article>
              );
            }

            return null;
          })}
        </div>
      </section>

      <div className="relative flex justify-center">
        <div className="absolute inset-0 h-20 w-72 rounded-full bg-gradient-to-r from-[#ffe29f]/15 via-[#ffa99f]/15 to-[#fbc2eb]/15 blur-3xl" />
        <Link
          href="/purchase"
          className="relative inline-flex h-14 items-center justify-center rounded-full border border-white/20 bg-gradient-to-r from-[#ffe29f] via-[#ffa99f] to-[#fbc2eb] px-10 text-sm font-semibold uppercase tracking-[0.35em] text-[#1f1428] shadow-[0_20px_45px_rgba(0,0,0,0.45),inset_0_4px_0_rgba(255,255,255,0.75),inset_0_-4px_0_rgba(0,0,0,0.25)] transition hover:scale-[1.02] active:scale-[0.98]"
        >
          チケット購入へ
        </Link>
      </div>
    </section>
  );
}
