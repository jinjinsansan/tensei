export default function TicketHistoryPage() {
  const history = [
    { label: 'フリーチケット受取', amount: '+1', date: '2026/02/12' },
    { label: '転生ガチャプレイ', amount: '-1', date: '2026/02/12' },
  ];

  return (
    <section className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">Tickets</p>
        <h1 className="font-display text-4xl text-white">チケット履歴</h1>
      </div>
      <div className="space-y-3">
        {history.map((entry) => (
          <div key={`${entry.label}-${entry.date}`} className="flex items-center justify-between rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white shadow-panel-inset">
            <div>
              <p className="text-base">{entry.label}</p>
              <p className="text-xs text-white/60">{entry.date}</p>
            </div>
            <span className={`text-lg font-display ${entry.amount.startsWith('+') ? 'text-neon-blue' : 'text-neon-pink'}`}>
              {entry.amount}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
