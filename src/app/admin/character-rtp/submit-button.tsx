'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton({ characterName }: { characterName: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-emerald-400/80 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
    >
      {pending ? `${characterName}の設定を保存中...` : `${characterName}の設定を保存`}
    </button>
  );
}
