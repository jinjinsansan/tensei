type Quality = 'low' | 'standard' | 'high';

const variants: Record<Quality, { label: string; container: string; dot: string; text: string; icon: string }> = {
  low: {
    label: '低品質',
    icon: 'SD',
    container: 'bg-orange-500/30 border border-orange-300/50',
    dot: 'bg-orange-300 shadow-[0_0_8px_rgba(251,146,60,0.55)]',
    text: 'text-orange-50',
  },
  standard: {
    label: '標準',
    icon: 'HD',
    container: 'bg-yellow-500/25 border border-yellow-300/50',
    dot: 'bg-yellow-200 shadow-[0_0_8px_rgba(250,204,21,0.5)]',
    text: 'text-yellow-50',
  },
  high: {
    label: '高品質',
    icon: 'FHD',
    container: 'bg-emerald-500/30 border border-emerald-300/50',
    dot: 'bg-emerald-200 shadow-[0_0_8px_rgba(52,211,153,0.55)]',
    text: 'text-emerald-50',
  },
};

export function QualityBadge({ quality, highlighted }: { quality: Quality; highlighted?: boolean }) {
  const variant = variants[quality];
  return (
    <div
      className={`pointer-events-auto inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold backdrop-blur-md shadow-[0_10px_32px_rgba(0,0,0,0.45)] transition ${variant.container} ${variant.text} ${highlighted ? 'ring-2 ring-white/70 ring-offset-2 ring-offset-black/40 scale-[1.03]' : ''}`}
    >
      <span className={`inline-block h-2 w-2 rounded-full ${variant.dot}`} />
      <span className="tracking-tight">{variant.icon}</span>
      <span className="tracking-wide">{variant.label}</span>
    </div>
  );
}

export type QualityLevel = Quality;
