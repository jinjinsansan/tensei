const ITEMS = [
  { title: '招待状', description: '友人へ書庫の入館案内を送信予定。', badge: 'COMING SOON' },
  { title: '物語ランキング', description: '人気の来世を共有するボードを制作中。', badge: 'IN PROGRESS' },
];

export default function SocialPage() {
  return (
    <section className="space-y-6 text-library-text-primary">
      <div className="space-y-2 text-center">
        <p className="font-accent text-xs uppercase tracking-[0.4em] text-library-accent">Invitations</p>
        <h1 className="font-serif text-3xl">招待状</h1>
        <p className="text-sm text-library-text-secondary">書庫を友人と共有する機能を順次解放していきます。</p>
      </div>
      <div className="space-y-4">
        {ITEMS.map((item) => (
          <article key={item.title} className="rounded-3xl border border-library-accent/20 bg-library-primary/70 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl">{item.title}</h2>
              <span className="rounded-full border border-library-accent/30 px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-library-accent">
                {item.badge}
              </span>
            </div>
            <p className="mt-2 text-sm text-library-text-secondary">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
