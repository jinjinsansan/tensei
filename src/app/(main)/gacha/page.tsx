import Image from "next/image";
import Link from "next/link";

import { GachaNeonPlayer } from "@/components/gacha/gacha-neon-player";
import { RoundMetalButton } from "@/components/gacha/controls/round-metal-button";
import { TicketBalanceCarousel } from "@/components/home/ticket-balance-carousel";
import { getSessionWithSnapshot } from "@/lib/app/session";
import type { TicketBalanceItem } from "@/lib/utils/tickets";

const FALLBACK_TICKETS: TicketBalanceItem[] = [
  { code: "free", name: "フリーチケット", quantity: 0, colorToken: "neon-blue", sortOrder: 0 },
  { code: "basic", name: "ベーシックチケット", quantity: 0, colorToken: "neon-yellow", sortOrder: 1 },
  { code: "epic", name: "エピックチケット", quantity: 0, colorToken: "neon-pink", sortOrder: 2 },
  { code: "premium", name: "プレミアムチケット", quantity: 0, colorToken: "neon-purple", sortOrder: 3 },
  { code: "ex", name: "EXチケット", quantity: 0, colorToken: "glow-green", sortOrder: 4 },
];

async function getTicketBalancesSafe() {
  if (process.env.BYPASS_MAIN_APP_GUARD === 'true') {
    return FALLBACK_TICKETS;
  }
  try {
    const { snapshot } = await getSessionWithSnapshot();
    return snapshot.tickets.length > 0 ? snapshot.tickets : FALLBACK_TICKETS;
  } catch (error) {
    console.warn('[gacha/page] Using fallback tickets:', error instanceof Error ? error.message : error);
    return FALLBACK_TICKETS;
  }
}

export default async function GachaPage() {
  const tickets = await getTicketBalancesSafe();

  return (
    <section className="mx-auto w-full max-w-5xl space-y-10 pb-10">
      <div className="space-y-4 rounded-3xl border border-white/10 bg-black/30 px-6 py-8 text-center shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.5em] text-neon-yellow">GACHA HALL</p>
        <h1 className="font-display text-4xl text-white">来世ガチャホール</h1>
        <p className="text-sm text-zinc-300">色んな人生に生まれ変わってみたい主人公達のための受付ホール。チケット残高を確認して来世へ挑戦。</p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-[0.65rem] uppercase tracking-[0.35em] text-white/70">
          <span className="rounded-full border border-white/15 px-4 py-1">動画演出フル収録</span>
          <span className="rounded-full border border-white/15 px-4 py-1">シリアル付与</span>
          <span className="rounded-full border border-white/15 px-4 py-1">v2 multi character</span>
        </div>
      </div>

      <section className="space-y-3 rounded-3xl border border-white/10 bg-black/25 px-6 py-6 shadow-panel-inset">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-neon-yellow">
          <span>Tickets</span>
        </div>
        <TicketBalanceCarousel tickets={tickets} />
      </section>

      <section className="space-y-6">
        {/* 来世ガチャカード */}
        <article className="relative overflow-hidden rounded-[36px] border border-white/8 bg-gradient-to-br from-[#06090f] via-[#0c1221] to-[#05070e] p-[1px] shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
          <div className="relative rounded-[34px] bg-gradient-to-br from-[#0a0f1a] via-[#11192a] to-[#05070e] px-6 py-8 sm:px-8">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(63,200,255,0.35),transparent_55%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.1),transparent_60%)]" />
              <div className="absolute inset-0 border border-white/10 rounded-[34px]" />
            </div>
            <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center">
              <div className="flex flex-1 flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white/20 bg-black/40 shadow-[0_0_35px_rgba(63,200,255,0.45)]">
                    <Image
                      src="/kenta_cards/card01_convenience.png"
                      alt="健太 アイコン"
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.4em] text-[#a8f1ff]">
                      GACHA
                    </span>
                    <h3 className="mt-2 font-display text-3xl text-white drop-shadow-[0_8px_25px_rgba(12,15,31,0.9)]">
                      来世ガチャ
                    </h3>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-white/85">
                  20代のコンビニ店員、50代の冴えないサラリーマン、主人公達に転生チャンスが訪れる！果たして望む来世を手に入れることが出来るのか？
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-white/75">
                  <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-1">
                    ガチャは１チケットを消費します
                  </span>
                </div>
              </div>
              <div className="flex flex-1 items-center justify-center lg:justify-end">
                <GachaNeonPlayer
                  playVariant="round"
                  playLabel="ガチャを\n始める"
                  containerClassName="space-y-1 text-center w-full max-w-[150px]"
                  buttonWrapperClassName="justify-center"
                />
              </div>
            </div>
          </div>
        </article>

        {/* バトルガチャカード（準備中） */}
        <article className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-[#12030b] via-[#1c090f] to-[#050103] p-[1px] shadow-[0_30px_80px_rgba(0,0,0,0.55)] opacity-95">
          <div className="relative rounded-[34px] bg-gradient-to-br from-[#1b050b] via-[#120107] to-[#050001] px-6 py-8 sm:px-8">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,99,155,0.25),transparent_55%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.08),transparent_60%)]" />
              <div className="absolute inset-0 border border-white/10 rounded-[34px]" />
            </div>
            <div className="absolute -right-12 top-7 rotate-45 rounded-sm bg-gradient-to-r from-[#ff6fb0] to-[#ff4378] px-10 py-1 text-[10px] font-bold tracking-[0.5em] text-white shadow-[0_10px_30px_rgba(255,67,120,0.35)]">
              準備中
            </div>
            <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center">
              <div className="flex flex-1 flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white/15 bg-black/40 shadow-[0_0_30px_rgba(255,99,155,0.4)]">
                    <Image
                      src="/kenta_cards/card12_hero.png"
                      alt="バトルガチャ アイコン"
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <span className="inline-flex items-center rounded-full border border-white/12 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-[#ff8ec5]">
                      GACHA
                    </span>
                    <h3 className="mt-2 font-display text-3xl text-white">バトルガチャ</h3>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-white/85">
                  来世ガチャに登場する主人公達が今度は１対１のバトルチャレンジを繰り広げる！果たして勝者はいったい誰なのか？
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-white/70">
                  <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-1">
                    ガチャは１チケットを消費します（予定）
                  </span>
                </div>
              </div>
              <div className="flex flex-1 items-center justify-center lg:justify-end">
                <div className="w-full max-w-[150px]">
                  <RoundMetalButton
                    label={"ガチャを\n始める"}
                    subLabel="START"
                    disabled
                    className="mx-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </article>
      </section>

      <div className="relative mt-4 flex justify-center">
        <div className="absolute inset-0 h-24 w-64 animate-pulse rounded-full bg-gradient-to-r from-[#ffe29f]/20 via-[#ffa99f]/20 to-[#fbc2eb]/20 blur-3xl" />
        <Link
          href="/how-to-play"
          className="relative inline-flex items-center gap-2 rounded-full border border-white/15 bg-gradient-to-r from-[#ffe29f] via-[#ffa99f] to-[#fbc2eb] px-10 py-4 text-sm font-semibold tracking-[0.25em] text-[#1a1828] shadow-[0_25px_60px_rgba(0,0,0,0.45),inset_0_4px_0_rgba(255,255,255,0.7),inset_0_-4px_0_rgba(0,0,0,0.25)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          使い方ガイドへ
        </Link>
      </div>
    </section>
  );
}
