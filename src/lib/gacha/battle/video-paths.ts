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

export function getBattleHitVideo(charId: string, starLevel: number): string {
  return battlePath(charId, `${charId}_battle_c${pad2(starLevel)}_hit.mp4`);
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

/** 汎用パスビルダー: charId と filename のみ指定 */
export function buildBattleVideoPath(charId: string, filename: string): string {
  return battlePath(charId, `${charId}_battle_${filename}.mp4`);
}

/** flat videoキューを組み立てる（17本） */
export type BattleQueueItem = {
  src: string;
  showCardOverlay?: boolean;
  overlayFor?: 'player' | 'enemy'; // 転生時にどちらのカードを表示するか
};

export function buildBattleVideoQueue(
  playerCharId: string,
  playerStar: number,
  enemyCharId: string,
  enemyStar: number,
  playerWins: boolean,
): BattleQueueItem[] {
  const p = (name: string) => buildBattleVideoPath(playerCharId, name);
  const e = (name: string) => buildBattleVideoPath(enemyCharId, name);
  const pPost = (action: string) => p(`c${pad2(playerStar)}_${action}`);
  const ePost = (action: string) => e(`c${pad2(enemyStar)}_${action}`);

  // PHASE 1〜3は常に自キャラ先手（固定）
  // PHASE 4は★が多い方が先手（優勢を演出するが勝敗は確定しない）
  // PHASE 5で初めて勝敗が明らかになる（ドキドキポイント）
  const playerHigher = playerStar >= enemyStar;

  // PHASE 5: 勝者映像
  const winnerPost = playerWins ? pPost : ePost;
  const loserPost  = playerWins ? ePost : pPost;

  return [
    // PHASE 1: 対峙（常に自キャラ先）
    { src: p('pre_face') },
    { src: e('pre_face') },
    // PHASE 2: 転生前バトル（自キャラ先）
    { src: p('pre_shout') },
    { src: p('pre_attack') },
    { src: e('pre_hit') },
    { src: e('pre_shout') },
    { src: e('pre_attack') },
    { src: p('pre_hit') },
    // PHASE 3: 両者転生（常に自キャラ先）
    { src: p('reincarnation'), showCardOverlay: true, overlayFor: 'player' },
    { src: e('reincarnation'), showCardOverlay: true, overlayFor: 'enemy' },
    // PHASE 4: 転生後バトル（★が多い方が先手）
    ...(playerHigher
      ? [
          { src: pPost('attack') },
          { src: ePost('hit') },
          { src: ePost('attack') },
          { src: pPost('hit') },
        ]
      : [
          { src: ePost('attack') },
          { src: pPost('hit') },
          { src: pPost('attack') },
          { src: ePost('hit') },
        ]),
    // PHASE 5: 決着（ここで初めて勝敗が判明）
    { src: winnerPost('attack') },  // とどめ
    { src: loserPost('lose') },     // 敗者
    { src: winnerPost('win') },     // 勝者
  ];
}
