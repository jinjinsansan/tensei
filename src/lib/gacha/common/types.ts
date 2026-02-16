export type Rarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR' | 'LR';

export type Grade = 'E1' | 'E2' | 'E3' | 'E4' | 'E5';

export type CdColor = 'green' | 'blue' | 'red' | 'rainbow';

export interface CountdownStep {
  number: number;
  color: CdColor;
}

export interface CountdownPattern {
  id: string;
  name: string;
  steps: [CountdownStep, CountdownStep, CountdownStep, CountdownStep];
}

export type StandbyColor = 'black' | 'white' | 'yellow' | 'red' | 'blue' | 'rainbow';

// v2: マルチキャラクターID
export type CharacterId = 'kenta' | 'shoichi';

export interface GachaResult {
  isLoss: boolean;
  characterId: CharacterId;
  cardId: string;
  rarity: Rarity;
  starRating: number;
  cardName: string;
  cardTitle: string;
  cardImagePath: string;
  lossCardImagePath?: string;
  isDonden: boolean;
  dondenFromCardId?: string;
  dondenFromRarity?: Rarity;
  isSequel: boolean;
}

export type GachaPhase =
  | 'STANDBY'
  | 'COUNTDOWN'
  | 'PUCHUN'
  | 'TITLE_VIDEO'
  | 'LOSS_REVEAL'
  | 'PRE_SCENE'
  | 'CHANCE_SCENE'
  | 'MAIN_SCENE'
  | 'DONDEN_SCENE'
  | 'CARD_REVEAL';

export interface TitleVideoSelection {
  videoCardId: string;
  starDisplay: number;
  isRealCard: boolean;
}

export interface CharacterModule {
  characterId: CharacterId;
  characterName: string;
  cards: CardDefinition[];
  preScenePatterns: PreScenePattern[];
  chanceScenes: ChanceScene[];
  dondenRoutes: DondenRoute[];
  getTitleVideoPath: (cardId: string) => string;
  getPreSceneVideoPath: (patternId: string, step: number) => string;
  getChanceSceneVideoPath: (patternId: string) => string;
  getMainSceneVideoPath: (cardId: string, step: number) => string;
  getDondenVideoPath: (fromCardId: string, toCardId: string, step: number) => string;
  getCardImagePath: (cardId: string) => string;
  getCardDisplayInfo: (cardId: string) => CardDisplayInfo;
}

export interface CardDefinition {
  cardId: string;
  name: string;
  title: string;
  rarity: Rarity;
  starRating: number;
  mainSceneSteps: number;
}

export interface PreScenePattern {
  patternId: string;
  steps: number;
}

export interface ChanceScene {
  patternId: string;
}

export interface DondenRoute {
  fromCardId: string;
  toCardId: string;
  steps: number;
}

export interface CardDisplayInfo {
  name: string;
  title: string;
  description: string;
  rarity: Rarity;
  starRating: number;
}
