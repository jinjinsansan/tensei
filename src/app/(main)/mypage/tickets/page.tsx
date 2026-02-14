export default function TicketHistoryPage() {
  const history = [
    { label: 'フリーチケット 受領', amount: '+1', date: '2026/02/12' },
    { label: '健太の物語を開封', amount: '-1', date: '2026/02/12' },
  ];

  return (
    <section className="space-y-6 text-primary">
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-accent">Tickets</p>
        <h1 className="text-3xl font-bold">チケットの記録</h1>
      </div>
      <div className="space-y-3">
        {history.map((entry) => (
          <div
            key={`${entry.label}-${entry.date}`}
            className="flex items-center justify-between rounded-3xl border border-accent/20 bg-card/60 px-4 py-3"
          >
            <div>
              <p className="text-base font-medium">{entry.label}</p>
              <p className="text-xs text-secondary">{entry.date}</p>
            </div>
            <span className={`text-lg font-semibold ${entry.amount.startsWith('+') ? 'text-accent' : 'text-secondary'}`}>
              {entry.amount}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
