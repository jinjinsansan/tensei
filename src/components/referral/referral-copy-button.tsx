'use client';

import { useState } from 'react';

type ReferralCopyButtonProps = {
  value: string;
};

export function ReferralCopyButton({ value }: ReferralCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] transition ${
        copied
          ? 'border border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
          : 'border border-white/20 bg-white/10 text-white hover:bg-white/20'
      }`}
    >
      {copied ? 'COPIED' : 'COPY LINK'}
    </button>
  );
}
