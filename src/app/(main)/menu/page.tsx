import { exitNeonHall } from '@/app/(auth)/actions';

const MENU_ITEMS = [
  { label: 'アカウント', description: 'プロフィールや通知設定（近日）' },
  { label: 'ヘルプ', description: '演出ガイドや提供割合を見る' },
  { label: '設定', description: 'サウンド、振動、画質の切り替え' },
];

export default function MenuPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">Menu</p>
        <h1 className="font-display text-4xl text-white">ホールメニュー</h1>
      </div>
      <div className="space-y-3">
        {MENU_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-3xl border border-white/10 bg-black/40 px-5 py-4 shadow-panel-inset">
            <div>
              <p className="text-lg font-display text-white">{item.label}</p>
              <p className="text-sm text-white/60">{item.description}</p>
            </div>
            <span className="text-xs uppercase tracking-[0.4em] text-white/50">MORE</span>
          </div>
        ))}
        <form action={exitNeonHall}>
          <button
            type="submit"
            className="w-full rounded-3xl border border-white/15 bg-gradient-to-r from-[#ff2d95] to-[#fff65c] px-6 py-4 text-sm font-semibold uppercase tracking-[0.35em] text-[#120714] shadow-neon"
          >
            ログアウト
          </button>
        </form>
      </div>
    </section>
  );
}
