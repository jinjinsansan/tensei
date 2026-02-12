const OPTIONS = [
  { label: '銅の栞 ×1', price: '¥1,100', description: '基本の章を開くための栞。' },
  { label: '銀の栞 ×5', price: '¥5,500', description: '続編や隠し章を狙いやすいセット。' },
  { label: '金の栞 ×10', price: '¥11,000', description: '伝説の書に挑むための豪華な束。' },
];

export default function PurchasePage() {
  return (
    <section className="space-y-6 text-library-text-primary">
      <div className="space-y-2 text-center">
        <p className="font-accent text-xs uppercase tracking-[0.4em] text-library-accent">Bookmarks</p>
        <h1 className="font-serif text-3xl">栞の補充</h1>
      </div>
      <div className="space-y-4">
        {OPTIONS.map((option) => (
          <div key={option.label} className="rounded-3xl border border-library-accent/20 bg-library-primary/70 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-serif text-lg">{option.label}</p>
                <p className="text-sm text-library-text-secondary">{option.description}</p>
              </div>
              <span className="font-accent text-xl text-library-accent">{option.price}</span>
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
