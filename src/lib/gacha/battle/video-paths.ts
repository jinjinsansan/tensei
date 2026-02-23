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

  // 勝者が先に登場（案B）
  const winner = playerWins;
  const fPre  = winner ? p : e;   // 先手（勝者）の転生前映像
  const sPre  = winner ? e : p;   // 後手（敗者）の転生前映像
  const fPost = winner ? pPost : ePost; // 先手（勝者）の転生後映像
  const sPost = winner ? ePost : pPost; // 後手（敗者）の転生後映像
  const fOverlay: 'player' | 'enemy' = winner ? 'player' : 'enemy';
  const sOverlay: 'player' | 'enemy' = winner ? 'enemy' : 'player';

  // PHASE 4: ★が多い方が先手（勝敗に関わらず）
  const playerHigher = playerStar >= enemyStar;

  return [
    // PHASE 1: 対峙（勝者が先に登場）
    { src: fPre('pre_face') },
    { src: sPre('pre_face') },
    // PHASE 2: 転生前バトル（勝者が先に攻撃）
    { src: fPre('pre_shout') },
    { src: fPre('pre_attack') },
    { src: sPre('pre_hit') },
    { src: sPre('pre_shout') },
    { src: sPre('pre_attack') },
    { src: fPre('pre_hit') },
    // PHASE 3: 両者転生（勝者が先に転生、それぞれのカードをオーバーレイ）
    { src: fPre('reincarnation'), showCardOverlay: true, overlayFor: fOverlay },
    { src: sPre('reincarnation'), showCardOverlay: true, overlayFor: sOverlay },
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
    // PHASE 5: 決着（勝者がとどめ）
    { src: fPost('attack') },  // とどめ
    { src: sPost('lose') },    // 敗者
    { src: fPost('win') },     // 勝者
  ];
}
