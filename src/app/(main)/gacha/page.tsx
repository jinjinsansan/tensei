import Image from "next/image";
import { TicketBalanceCarousel } from "@/components/home/ticket-balance-carousel";
import { GachaNeonPlayer } from "@/components/gacha/gacha-neon-player";
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
    <section className="space-y-10">
      <div className="space-y-2 text-center">
        <div className="relative inline-block">
          <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-pink-500/15 blur-2xl" />
          <h1 className="relative font-display text-5xl font-bold tracking-[0.05em] text-transparent bg-gradient-to-r from-[#fff65c] via-[#ff9b3d] to-[#ff2d95] bg-clip-text drop-shadow-[0_0_50px_rgba(255,246,92,0.8)] drop-shadow-[0_0_90px_rgba(255,157,61,0.6)] drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
            ガチャホール
          </h1>
        </div>
        <p className="text-sm text-white/70">色んな人生に生まれ変わってみたいと願う主人公達</p>
      </div>

      <section className="space-y-3 rounded-3xl border border-white/10 bg-black/30 px-5 py-5">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-neon-yellow">
          <span>Tickets</span>
        </div>
        <TicketBalanceCarousel tickets={tickets} />
      </section>

      <section className="space-y-4">
        <article className="relative overflow-hidden rounded-3xl border border-white/12 px-6 py-6 shadow-[0_20px_55px_rgba(0,0,0,0.55)]">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#3bd9ff]/35 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_60%)]" />
          <div className="absolute inset-0 border border-white/10" />

          <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/30 bg-white/10 shadow-[0_0_20px_rgba(59,217,255,0.35)]">
                  <Image
                    src="/kenta_cards/card01_convenience.png"
                    alt="健太ガチャ アイコン"
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-neon-blue">
                    GACHA
                  </p>
                  <h3 className="mt-2 font-display text-2xl text-white">健太ガチャ</h3>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-white/85">
                コンビニの深夜バイトで働く健太。毎日代わり映えしない日々の中である日転生チャンスが訪れる。健太の来世はいかに？
              </p>
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.7rem] text-white/75">
                ガチャは１チケットを消費します
              </span>
            </div>
            <div className="flex w-full justify-center sm:w-auto sm:justify-end">
              <GachaNeonPlayer playVariant="round" />
            </div>
          </div>
        </article>
      </section>
    </section>
  );
}
