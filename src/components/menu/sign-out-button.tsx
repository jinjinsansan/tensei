'use client';

import { useFormStatus } from 'react-dom';
import { exitNeonHall } from '@/app/(auth)/actions';

export function SignOutButton() {
  const { pending } = useFormStatus();

  return (
    <form action={exitNeonHall} className="relative flex justify-center">
      <div className="absolute inset-0 h-16 w-64 rounded-full bg-gradient-to-r from-[#ffe29f]/20 via-[#ffa99f]/20 to-[#fbc2eb]/20 blur-3xl" />
      <button
        type="submit"
        disabled={pending}
        className="relative w-full max-w-sm rounded-full border border-white/15 bg-gradient-to-r from-[#ffe29f] via-[#ffa99f] to-[#fbc2eb] px-10 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-[#201327] shadow-[0_20px_45px_rgba(0,0,0,0.45),inset_0_4px_0_rgba(255,255,255,0.75),inset_0_-4px_0_rgba(0,0,0,0.25)] transition hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
      >
        {pending ? 'SIGNING OUT...' : 'SIGN OUT'}
      </button>
    </form>
  );
}
