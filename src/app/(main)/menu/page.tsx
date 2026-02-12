const MENU_ITEMS = [
  { label: 'アカウント', description: 'プロフィール管理（準備中）' },
  { label: 'ヘルプ', description: '演出ガイドと提供割合' },
  { label: '設定', description: '音や振動の切替' },
];

export default function MenuPage() {
  return (
    <section className="space-y-6 text-primary">
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-accent">Archive Menu</p>
        <h1 className="text-3xl font-bold">書庫メニュー</h1>
      </div>
      <div className="space-y-3">
        {MENU_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-3xl border border-accent/15 bg-card/60 px-5 py-4">
            <div>
              <p className="text-lg font-medium">{item.label}</p>
              <p className="text-sm text-secondary">{item.description}</p>
            </div>
            <span className="text-xs font-medium uppercase tracking-[0.4em] text-secondary">Soon</span>
          </div>
        ))}
      </div>
    </section>
  );
}
