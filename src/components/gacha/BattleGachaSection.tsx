'use client';

import { BattleGachaNeonPlayer } from '@/components/gacha/battle-gacha-neon-player';

export function BattleGachaButton() {
  return (
    <BattleGachaNeonPlayer
      containerClassName="space-y-1 text-center w-full max-w-[150px]"
      buttonWrapperClassName="justify-center"
    />
  );
}
