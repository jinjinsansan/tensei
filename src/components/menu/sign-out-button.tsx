'use client';

import { useFormStatus } from 'react-dom';
import { exitNeonHall } from '@/app/(auth)/actions';

export function SignOutButton() {
  const { pending } = useFormStatus();

  return (
    <form action={exitNeonHall}>
      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-full rounded-full border border-white/20 px-4 py-3 text-[11px] uppercase tracking-[0.35em] text-white transition-colors duration-150 hover:border-neon-pink hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'SIGNING OUT...' : 'SIGN OUT'}
      </button>
    </form>
  );
}
