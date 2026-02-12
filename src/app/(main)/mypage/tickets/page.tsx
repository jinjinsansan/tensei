export default function TicketHistoryPage() {
  const history = [
    { label: '無料の栞 受領', amount: '+1', date: '2026/02/12' },
    { label: '健太の物語を開封', amount: '-1', date: '2026/02/12' },
  ];

  return (
    <section className="space-y-6 text-library-text-primary">
      <div className="space-y-2 text-center">
        <p className="font-accent text-xs uppercase tracking-[0.4em] text-library-accent">Bookmarks</p>
        <h1 className="font-serif text-3xl">栞の記録</h1>
      </div>
      <div className="space-y-3">
        {history.map((entry) => (
          <div
            key={`${entry.label}-${entry.date}`}
            className="flex items-center justify-between rounded-3xl border border-library-accent/20 bg-library-primary/60 px-4 py-3"
          >
            <div>
              <p className="font-serif text-base">{entry.label}</p>
              <p className="text-xs text-library-text-secondary">{entry.date}</p>
            </div>
            <span className={`font-accent text-lg ${entry.amount.startsWith('+') ? 'text-library-accent' : 'text-library-text-secondary'}`}>
              {entry.amount}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
