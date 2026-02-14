type Props = {
  title: string;
  subtitle?: string;
  details?: string;
};

export function PhasePlaceholder({ title, subtitle, details }: Props) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-center text-white">
      <div className="text-xs uppercase tracking-[0.4em] text-white/50">{subtitle}</div>
      <h2 className="text-3xl font-bold tracking-[0.08em] text-white drop-shadow-[0_3px_20px_rgba(0,0,0,0.55)]">
        {title}
      </h2>
      {details ? <p className="max-w-sm text-sm text-white/70">{details}</p> : null}
    </div>
  );
}
