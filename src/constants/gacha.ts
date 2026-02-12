export type GachaDefinition = {
  id: 'free' | 'basic' | 'epic' | 'premium' | 'ex';
  name: string;
  rarityRange: [number, number];
  ticketLabel: string;
  description: string;
  priceLabel: string;
  gradient: string;
  featuredNote?: string;
};

export const GACHA_DEFINITIONS: GachaDefinition[] = [
  {
    id: 'free',
    name: '無料の栞',
    rarityRange: [1, 3],
    ticketLabel: '無料の栞',
    description: '日替わりで受け取れる栞で開く序章。',
    priceLabel: 'FREE / DAY',
    gradient: 'from-[#6b5742]/40 to-transparent',
  },
  {
    id: 'basic',
    name: '銅の栞',
    rarityRange: [1, 4],
    ticketLabel: '銅の栞',
    description: '書庫入口で最も読まれている定番の章。',
    priceLabel: '栞 ×1',
    gradient: 'from-[#8b5a2b]/40 to-transparent',
  },
  {
    id: 'epic',
    name: '銀の栞',
    rarityRange: [2, 4],
    ticketLabel: '銀の栞',
    description: '閲覧室の司書が薦める人気の物語。',
    priceLabel: '栞 ×2',
    gradient: 'from-[#6a7a8a]/40 to-transparent',
    featuredNote: '★3以上確定',
  },
  {
    id: 'premium',
    name: '金の栞',
    rarityRange: [3, 5],
    ticketLabel: '金の栞',
    description: '隠された章が現れやすい貴重な巻。',
    priceLabel: '栞 ×4',
    gradient: 'from-[#c9a84c]/30 to-transparent',
    featuredNote: 'SSR排出率アップ',
  },
  {
    id: 'ex',
    name: '白金の栞',
    rarityRange: [4, 5],
    ticketLabel: '白金の栞',
    description: '天空書庫の最深部に眠る禁断の書。',
    priceLabel: '栞 ×10',
    gradient: 'from-[#b5a9ff]/30 to-transparent',
    featuredNote: '演出完全解放',
  },
];
