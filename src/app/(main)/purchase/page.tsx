const OPTIONS = [
  { label: 'ベーシックチケット ×1', price: '¥1,100', description: 'まずはここから試せる標準チケット。' },
  { label: 'エピックチケット ×5', price: '¥5,500', description: 'レアな人生に出会いやすいセット。' },
  { label: 'プレミアムチケット ×10', price: '¥11,000', description: '最上級の演出を楽しめる豪華な束。' },
];

export default function PurchasePage() {
  return (
    <section className="space-y-6 text-primary">
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-accent">Tickets</p>
        <h1 className="text-3xl font-bold">チケットの補充</h1>
      </div>
      <div className="space-y-4">
        {OPTIONS.map((option) => (
          <div key={option.label} className="rounded-3xl border border-accent/20 bg-card/70 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium">{option.label}</p>
                <p className="text-sm text-secondary">{option.description}</p>
              </div>
              <span className="text-xl font-semibold text-accent">{option.price}</span>
            </div>
            <button type="button" className="library-button secondary mt-4 w-full">
              購入予約（準備中）
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
