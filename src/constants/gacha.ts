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
    name: 'フリーチケット',
    rarityRange: [1, 3],
    ticketLabel: 'フリーチケット',
    description: '日替わりでもらえるお試しチケット。',
    priceLabel: 'FREE / DAY',
    gradient: 'from-[#6b5742]/40 to-transparent',
  },
  {
    id: 'basic',
    name: 'ベーシックチケット',
    rarityRange: [1, 4],
    ticketLabel: 'ベーシックチケット',
    description: '最もスタンダードなガチャチケット。',
    priceLabel: 'チケット ×1',
    gradient: 'from-[#8b5a2b]/40 to-transparent',
  },
  {
    id: 'epic',
    name: 'エピックチケット',
    rarityRange: [2, 4],
    ticketLabel: 'エピックチケット',
    description: '熱量の高い演出が楽しめる特別チケット。',
    priceLabel: 'チケット ×2',
    gradient: 'from-[#6a7a8a]/40 to-transparent',
    featuredNote: '★3以上確定',
  },
  {
    id: 'premium',
    name: 'プレミアムチケット',
    rarityRange: [3, 5],
    ticketLabel: 'プレミアムチケット',
    description: '重厚な演出と高レアカードに挑戦できるチケット。',
    priceLabel: 'チケット ×4',
    gradient: 'from-[#c9a84c]/30 to-transparent',
    featuredNote: 'SSR排出率アップ',
  },
  {
    id: 'ex',
    name: 'EXチケット',
    rarityRange: [4, 5],
    ticketLabel: 'EXチケット',
    description: '最上級の演出とEXカードが狙える特別なチケット。',
    priceLabel: 'チケット ×10',
    gradient: 'from-[#b5a9ff]/30 to-transparent',
    featuredNote: '演出完全解放',
  },
];
