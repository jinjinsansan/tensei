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

const HINTS = [
  "STANDBY/COUNTDOWN/TITLE はすべて 60% が本命ヒント",
  "どんでん返し発生時は偽カード→本カードを強調",
  "SKIP は Phase 2 と Phase 4-A のみで利用可能",
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
      <header className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#1b0f2f]/90 via-[#090316]/95 to-[#050208]/95 px-8 py-10 shadow-[0_35px_90px_rgba(0,0,0,0.75)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.6em] text-white/40">RAISE GACHA</p>
            <h1 className="font-display text-5xl tracking-[0.05em] text-white">来世ガチャ体験ホール</h1>
            <p className="text-sm text-white/70">
              「もしも生まれ変わったら」を映像で体験するフルスクリーンガチャ。共通テンプレート + キャラ固有演出で
              STANDBY → COUNTDOWN → プチュン → タイトル動画 → 転生シーン → カードリビールを一気に再生します。
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {HINTS.map((hint) => (
                <div
                  key={hint}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[0.78rem] text-white/75"
                >
                  {hint}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 rounded-[28px] border border-white/10 bg-black/30 px-6 py-6 text-center">
            <div className="text-xs uppercase tracking-[0.4em] text-white/60">START</div>
            <p className="text-sm text-white/70">チケット 1 枚で健太モジュールを再生します。</p>
            <GachaNeonPlayer playVariant="round" playLabel="来世ガチャ" />
            <p className="text-[11px] text-white/50">演出開始後は自動でフルスクリーン表示されます。</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="rounded-[32px] border border-white/10 bg-black/30 px-6 py-6">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-neon-yellow">
            <span>Ticket Balance</span>
          </div>
          <div className="mt-4">
            <TicketBalanceCarousel tickets={tickets} />
          </div>
        </section>

        <aside className="rounded-[32px] border border-white/10 bg-black/35 px-6 py-6">
          <p className="text-xs uppercase tracking-[0.4em] text-white/45">Flow</p>
          <div className="mt-4 space-y-4">
            {FLOW.map((item) => (
              <div key={item.phase} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">{item.phase}</p>
                <h3 className="font-display text-lg text-white">{item.title}</h3>
                <p className="text-sm text-white/70">{item.description}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
