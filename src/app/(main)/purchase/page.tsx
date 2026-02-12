const OPTIONS = [
  { label: 'ベーシック 1枚', price: '¥1,100', description: '通常演出を楽しめる基本セット。' },
  { label: 'エピック 5枚', price: '¥5,500', description: '熱い演出が増える中級セット。' },
  { label: 'プレミアム 10枚', price: '¥11,000', description: 'SSR率が上がる上位セット。' },
];

export default function PurchasePage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">Purchase</p>
        <h1 className="font-display text-4xl text-white">チケット購入</h1>
      </div>
      <div className="space-y-4">
        {OPTIONS.map((option) => (
          <div key={option.label} className="rounded-3xl border border-white/10 bg-black/35 p-5 shadow-panel-inset">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-display text-white">{option.label}</p>
                <p className="text-sm text-white/60">{option.description}</p>
              </div>
              <span className="text-xl font-display text-neon-yellow">{option.price}</span>
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-full border border-white/20 px-4 py-2 text-sm uppercase tracking-[0.35em] text-white/90"
            >
              購入予約（準備中）
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
