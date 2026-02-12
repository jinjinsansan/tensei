const ITEMS = [
  { title: '招待状', description: '友人へ書庫の入館案内を送信予定。', badge: 'COMING SOON' },
  { title: '物語ランキング', description: '人気の来世を共有するボードを制作中。', badge: 'IN PROGRESS' },
];

export default function SocialPage() {
  return (
    <section className="space-y-6 text-primary">
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-accent">Invitations</p>
        <h1 className="text-3xl font-bold">招待状</h1>
        <p className="text-sm text-secondary">書庫を友人と共有する機能を順次解放していきます。</p>
      </div>
      <div className="space-y-4">
        {ITEMS.map((item) => (
          <article key={item.title} className="rounded-3xl border border-accent/20 bg-card/70 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{item.title}</h2>
              <span className="rounded-full border border-accent/30 px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.35em] text-accent">
                {item.badge}
              </span>
            </div>
            <p className="mt-2 text-sm text-secondary">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
