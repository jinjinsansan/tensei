import type { CardDefinition } from '@/lib/gacha/common/types';

export const REIKO_CARDS: CardDefinition[] = [
  { cardId: 'reiko_card01', name: '野良猫転生', title: '雨の路地裏で野良猫に転生', rarity: 'N', starRating: 1, mainSceneSteps: 2 },
  { cardId: 'reiko_card02', name: '案山子転生', title: '田んぼの案山子に転生', rarity: 'N', starRating: 2, mainSceneSteps: 2 },
  { cardId: 'reiko_card03', name: '邪魔者扱いされる魔女転生', title: '中世ヨーロッパで魔女に転生', rarity: 'R', starRating: 3, mainSceneSteps: 3 },
  { cardId: 'reiko_card04', name: '平凡な4人家族の母転生', title: '普通の母に転生', rarity: 'R', starRating: 4, mainSceneSteps: 3 },
  { cardId: 'reiko_card05', name: '江戸時代のお茶屋女将転生', title: '江戸の茶屋女将に転生', rarity: 'SR', starRating: 5, mainSceneSteps: 3 },
  { cardId: 'reiko_card06', name: '宇宙人転生', title: '宇宙人に転生', rarity: 'SR', starRating: 6, mainSceneSteps: 3 },
  { cardId: 'reiko_card07', name: '修道女転生', title: '修道女に転生', rarity: 'SSR', starRating: 7, mainSceneSteps: 4 },
  { cardId: 'reiko_card08', name: '幕末の女スパイ転生', title: '幕末の女スパイに転生', rarity: 'SSR', starRating: 8, mainSceneSteps: 4 },
  { cardId: 'reiko_card09', name: '本物の占い師転生', title: '本物の霊力を持つ占い師に転生', rarity: 'UR', starRating: 9, mainSceneSteps: 4 },
  { cardId: 'reiko_card10', name: '女王転生', title: '大国の女王に転生', rarity: 'UR', starRating: 10, mainSceneSteps: 4 },
  { cardId: 'reiko_card11', name: 'ジャンヌ・ダルク転生', title: '中世フランスの英雄に転生', rarity: 'LR', starRating: 11, mainSceneSteps: 5 },
  { cardId: 'reiko_card12', name: '天界の門番転生', title: '天界の門番に転生', rarity: 'LR', starRating: 12, mainSceneSteps: 5 },
];

export const REIKO_CARD_DESCRIPTIONS: Record<string, string> = {
  reiko_card01: '雨の路地裏で野良猫に転生。誰もいないのに大真面目に「波動が低い」と宣告する。',
  reiko_card02: '田んぼの案山子に転生。烏に踏み台にされても威厳だけは一丁前。',
  reiko_card03: '中世ヨーロッパで魔女に転生。村人に追い払われても霊界のお告げを叫び続ける。',
  reiko_card04: '普通の母に転生。夕食も宿題も全て霊能者スタイルで乗り切る。',
  reiko_card05: '江戸の茶屋女将に転生。神秘的な威厳が本物の格として機能する。',
  reiko_card06: '宇宙人に転生。強烈なメイクのまま宇宙船の乗組員を統率する。',
  reiko_card07: '修道女に転生。祈りの中で初めて本物の涙を流す。',
  reiko_card08: '幕末の女スパイに転生。大真面目な威圧感が暗躍にぴったりはまる。',
  reiko_card09: '本物の霊力を持つ占い師に転生。水晶玉が本当に光り、本当に見えた。',
  reiko_card10: '大国の女王に転生。表情は何も変わっていない。世界がやっと追いついた。',
  reiko_card11: '中世フランスの英雄に転生。羽根扇子を掲げ軍勢を率いて歴史を変える。',
  reiko_card12: '天界の門番に転生。全ての魂を大真面目に審査する宇宙最強の霊能者。',
};
