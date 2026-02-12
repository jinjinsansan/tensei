const ITEMS = [
  { title: 'コミュニティ', description: '尊師ホールの最新情報をシェア予定。', badge: 'COMING SOON' },
  { title: 'ランキング', description: '引き強ランキングを近日公開。', badge: 'IN PROGRESS' },
];

export default function SocialPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">Social</p>
        <h1 className="font-display text-4xl text-white">ソーシャルハブ</h1>
        <p className="text-sm text-white/70">尊師ガチャの導線と同じタブ構成で進捗を確認。</p>
      </div>
      <div className="space-y-4">
        {ITEMS.map((item) => (
          <article key={item.title} className="rounded-3xl border border-white/10 bg-black/30 p-5 shadow-panel-inset">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-white">{item.title}</h2>
              <span className="rounded-full border border-white/15 px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-white/80">
                {item.badge}
              </span>
            </div>
            <p className="mt-2 text-sm text-white/70">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
