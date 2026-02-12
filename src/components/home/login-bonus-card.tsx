import { Bookmark } from 'lucide-react';
import type { LoginBonusState } from '@/hooks/use-login-bonus';

type LoginBonusCardProps = {
  state: LoginBonusState;
  claiming: boolean;
  onClaim: () => Promise<void>;
};

export function LoginBonusCard({ state, claiming, onClaim }: LoginBonusCardProps) {
  const buttonLabel = state.claimed || state.status === 'success'
    ? '受取済み'
    : claiming
      ? '付与中...'
      : '栞を受け取る';

  return (
    <div className="library-card flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-dim text-accent">
          <Bookmark className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.45em] text-accent">日替わりの栞</p>
          <h3 className="text-lg font-medium text-primary">無料の栞 ×{state.quantity}</h3>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <p className="text-3xl font-semibold text-primary">+{state.quantity}</p>
          <p className="text-xs text-secondary">今日だけの贈り物</p>
        </div>
        <button
          type="button"
          onClick={() => {
            void onClaim();
          }}
          disabled={claiming || state.claimed}
          className="library-button secondary px-6 disabled:opacity-60"
        >
          {buttonLabel}
        </button>
      </div>

      {state.nextResetAt && (
        <p className="text-[0.7rem] text-secondary">次回受取: {new Date(state.nextResetAt).toLocaleString('ja-JP')}</p>
      )}

      {state.status === 'success' && (
        <p className="text-sm text-accent">{state.message ?? '本日の栞をお渡ししました。'}</p>
      )}
    </div>
  );
}
