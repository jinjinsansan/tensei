import { buildGachaAssetPath } from '@/lib/gacha/assets';

// Phase 1 で動画が揃っているキャラクター
export const BATTLE_READY_CHARACTERS = ['kenta', 'shoichi'] as const;
export type BattleCharacterId = (typeof BATTLE_READY_CHARACTERS)[number];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function battlePath(charId: string, filename: string): string {
  return buildGachaAssetPath('battle', charId, filename);
}

export function getBattlePreFaceVideo(charId: string): string {
  return battlePath(charId, `${charId}_battle_pre_face.mp4`);
}

export function getBattlePreShoutVideo(charId: string): string {
  return battlePath(charId, `${charId}_battle_pre_shout.mp4`);
}

export function getBattlePreAttackVideo(charId: string): string {
  return battlePath(charId, `${charId}_battle_pre_attack.mp4`);
}

export function getBattlePreHitVideo(charId: string): string {
  return battlePath(charId, `${charId}_battle_pre_hit.mp4`);
}

export function getBattleReincarnationVideo(charId: string): string {
  return battlePath(charId, `${charId}_battle_reincarnation.mp4`);
}

export function getBattleAttackVideo(charId: string, starLevel: number): string {
  return battlePath(charId, `${charId}_battle_c${pad2(starLevel)}_attack.mp4`);
}

export function getBattleWinVideo(charId: string, starLevel: number): string {
  return battlePath(charId, `${charId}_battle_c${pad2(starLevel)}_win.mp4`);
}

export function getBattleLoseVideo(charId: string, starLevel: number): string {
  return battlePath(charId, `${charId}_battle_c${pad2(starLevel)}_lose.mp4`);
}

export function isBattleReadyCharacter(charId: string): charId is BattleCharacterId {
  return BATTLE_READY_CHARACTERS.includes(charId as BattleCharacterId);
}
