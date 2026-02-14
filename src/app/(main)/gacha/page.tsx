import { GachaNeonPlayer } from "@/components/gacha/gacha-neon-player";

const FLOW: { phase: string; title: string; description: string }[] = [
  { phase: "PHASE 1", title: "STANDBY", description: "待機映像で来世ヒントを 60% の信頼度で先出し" },
  { phase: "PHASE 2", title: "COUNTDOWN", description: "色が昇格するたびに期待度アップ。SKIP で一気に Phase 3" },
  { phase: "PHASE 3", title: "PUCHUN", description: "プチュン発生で当たり確定。演出は自動再生" },
  { phase: "PHASE 3.5", title: "TITLE VIDEO", description: "タイトル動画＋★ヒントで転生先を推理" },
  { phase: "PHASE 4", title: "転生前→チャンス→メイン", description: "健太固有シナリオ。NEXT でテンポ良く進行" },
  { phase: "PHASE 5", title: "CARD REVEAL", description: "テキストカードで結果を仮表示。正式UIは後日差し替え" },
];
export default function GachaPage() {
  return (
    <section className="space-y-6">
      <header className="text-center">
        <p className="text-[11px] uppercase tracking-[0.6em] text-white/40">RAISE GACHA</p>
        <h1 className="mt-2 font-display text-3xl tracking-[0.05em] text-white">来世ガチャ</h1>
      </header>

      <div className="rounded-[30px] border border-white/10 bg-black/35 px-5 py-6">
        <p className="text-xs uppercase tracking-[0.45em] text-white/45">Flow</p>
        <div className="mt-4 space-y-4">
          {FLOW.map((item) => (
            <div key={item.phase} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">{item.phase}</p>
              <h3 className="font-display text-lg text-white">{item.title}</h3>
              <p className="text-sm text-white/70">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[30px] border border-white/10 bg-black/45 px-5 py-6 text-center">
        <GachaNeonPlayer playVariant="default" playLabel="来世ガチャ" />
      </div>
    </section>
  );
}
