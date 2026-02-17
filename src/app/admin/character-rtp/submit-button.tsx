'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton({ characterName }: { characterName: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-gradient-to-r from-[#7efde5] to-[#4dd8ff] px-5 py-2 text-sm font-semibold text-[#0b0b0b] transition hover:from-[#aefdf0] hover:to-[#72e6ff] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? `${characterName}の設定を保存中...` : `${characterName}の設定を保存`}
    </button>
  );
}
