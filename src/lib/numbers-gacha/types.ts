export type NumbersResultType =
  | 'miss'
  | 'star1' | 'star2' | 'star3' | 'star4' | 'star5' | 'star6'
  | 'star7' | 'star8' | 'star9' | 'star10' | 'star11' | 'star12';

export type NumbersStage = 'first' | 'second' | 'third' | 'final';

export type NumbersStep =
  // STANDBY (6種ランダム選択)
  | 'standby_black' | 'standby_blue' | 'standby_rainbow'
  | 'standby_red'   | 'standby_white' | 'standby_yellow'
  // TITLE (期待度オーバーレイ表示タイミング)
  | 'title'
  // 当たり演出
  | 'puchun'
  | 'win_confirm'
  // 昇格演出 (2種交互に使用)
  | 'promotion_a'   // 修正版昇格確定映像
  | 'patlite'       // 修正版パトライト映像 (昇格B兼どんでん返しlv2)
  // 失敗・降格
  | 'challenge_fail'  // 修正版チャレンジ失敗映像
  | 'demotion_full'   // 修正版降格映像 (一気に最下層)
  | 'loser'           // ハズレ確定 (映像なし→結果カード表示)
  // どんでん返し復活
  | 'revival_1'     // 修正版復活確定映像 (comeback lv1)
  | 'revival_3'     // 修正版虹色数字映像 (comeback lv3・最高)
  // カウントダウン映像
  | `cd_red_${number}`
  | `cd_green_${number}`
  | `cd_blue_${number}`
  | `cd_rainbow_${number}`;

export type CountdownColor = 'red' | 'green' | 'blue' | 'rainbow';

export interface NumbersScenario {
  id?: string;
  code: string;
  label: string;
  description?: string;
  resultType: NumbersResultType;
  sequence: NumbersStep[];
  finalStage: NumbersStage;
  weight?: number;
  isActive?: boolean;
  isCustom?: boolean;
}

export interface NumbersSettings {
  id: string;
  isActive: boolean;
  lossRate: number;
  starDistribution: number[];
  earlyMissEnabled: boolean;
  earlyMissMinCount: number;
  revivalRate: number;
  demotionEnabled: boolean;
  maxPromotions: number;
}

export interface NumbersPlayScenario extends NumbersScenario {
  expectationStars: number;
}
