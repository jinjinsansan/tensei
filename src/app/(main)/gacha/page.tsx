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

const FLOW: { phase: string; title: string; description: string }[] = [
  { phase: "PHASE 1", title: "STANDBY", description: "待機映像で来世ヒントを 60% の信頼度で先出し" },
  { phase: "PHASE 2", title: "COUNTDOWN", description: "色が昇格するたびに期待度アップ。SKIP で一気に Phase 3" },
  { phase: "PHASE 3", title: "PUCHUN", description: "プチュン発生で当たり確定。演出は自動再生" },
  { phase: "PHASE 3.5", title: "TITLE VIDEO", description: "タイトル動画＋★ヒントで転生先を推理" },
  { phase: "PHASE 4", title: "転生前→チャンス→メイン", description: "健太固有シナリオ。NEXT でテンポ良く進行" },
  { phase: "PHASE 5", title: "CARD REVEAL", description: "テキストカードで結果を仮表示。正式UIは後日差し替え" },
];
const HIGHLIGHTS = [
  {
    title: "共通 × キャラ固有演出",
    description: "カウントダウン、プチュン、転生シナリオをフルスクリーンでノンストップ再生",
  },
  {
    title: "テキストカードで先行公開",
    description: "正式なカード UI は後日差し替え予定。今はテキストで結果を即座に表示",
  },
  {
    title: "NEXT / SKIP でテンポ調整",
    description: "COUNTDOWN は SKIP で Phase 3 へジャンプ。メインは NEXT でテンポ良く進行",
  },
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
    <main className="space-y-10">
      <section className="rounded-[40px] border border-white/10 bg-gradient-to-r from-[#1a0c2c]/95 via-[#080414]/95 to-[#050208]/95 px-6 py-10 shadow-[0_40px_120px_rgba(0,0,0,0.75)] lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[3fr_2fr] lg:items-center">
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.55em] text-white/50">RAISE GACHA EXPERIENCE</p>
              <h1 className="mt-3 font-display text-4xl leading-tight tracking-[0.04em] text-white sm:text-5xl">
                来世ガチャ セレモニー
              </h1>
              <p className="mt-4 text-base text-white/75">
                カウントダウン、プチュン、タイトル動画、転生シーンを完全フルスクリーンでノンストップ再生。制作中の UI を一新し、
                誰でもワンクリックで健太モジュールの来世を追体験できます。
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {HIGHLIGHTS.map((item) => (
                <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">{item.title}</p>
                  <p className="mt-2 text-sm text-white/75">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[32px] border border-white/15 bg-black/40 p-6 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-white/55">TRY NOW</p>
            <p className="mt-3 text-sm text-white/70">チケット残高が 0 の場合もデモ再生で全演出を確認できます。</p>
            <div className="mt-6 flex justify-center">
              <GachaNeonPlayer playVariant="round" playLabel="来世ガチャ" />
            </div>
            <p className="mt-4 text-[11px] text-white/45">フルスクリーン再生中は NEXT / SKIP でテンポをコントロールできます。</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
        <div className="rounded-[32px] border border-white/10 bg-black/35 px-6 py-6">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-neon-yellow">
            <span>Ticket Balance</span>
          </div>
          <div className="mt-4">
            <TicketBalanceCarousel tickets={tickets} />
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-black/30 px-6 py-6">
          <p className="text-xs uppercase tracking-[0.45em] text-white/45">Flow</p>
          <div className="mt-4 grid gap-4">
            {FLOW.map((item) => (
              <div key={item.phase} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">{item.phase}</p>
                <h3 className="font-display text-xl text-white">{item.title}</h3>
                <p className="text-sm text-white/70">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
