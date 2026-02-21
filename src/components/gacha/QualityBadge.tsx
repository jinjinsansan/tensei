type Quality = 'low' | 'standard' | 'high';

const variants: Record<Quality, { label: string; container: string; dot: string; text: string; icon: string }> = {
  low: {
    label: '低品質',
    icon: 'SD',
    container: 'bg-orange-500/20 border border-orange-400/30',
    dot: 'bg-orange-400',
    text: 'text-orange-50',
  },
  standard: {
    label: '標準',
    icon: 'HD',
    container: 'bg-yellow-500/20 border border-yellow-400/30',
    dot: 'bg-yellow-300',
    text: 'text-yellow-50',
  },
  high: {
    label: '高品質',
    icon: 'FHD',
    container: 'bg-emerald-500/20 border border-emerald-400/30',
    dot: 'bg-emerald-300',
    text: 'text-emerald-50',
  },
};

export function QualityBadge({ quality, highlighted }: { quality: Quality; highlighted?: boolean }) {
  const variant = variants[quality];
  return (
    <div
      className={`pointer-events-auto inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm shadow-[0_6px_18px_rgba(0,0,0,0.35)] transition ${variant.container} ${variant.text} ${highlighted ? 'ring-2 ring-white/60 ring-offset-2 ring-offset-black/40' : ''}`}
    >
      <span className={`inline-block h-2 w-2 rounded-full ${variant.dot}`} />
      <span className="tracking-tight">{variant.icon}</span>
      <span className="tracking-wide">{variant.label}</span>
    </div>
  );
}

export type QualityLevel = Quality;
