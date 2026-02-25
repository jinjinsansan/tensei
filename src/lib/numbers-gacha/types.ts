export type NumbersResultType =
  | 'miss'
  | 'star1'
  | 'star2'
  | 'star3'
  | 'star4'
  | 'star5'
  | 'star6'
  | 'star7'
  | 'star8'
  | 'star9'
  | 'star10'
  | 'star11'
  | 'star12';

export type NumbersStage = 'first' | 'second' | 'third' | 'final';

export type CountdownColor = 'red' | 'green' | 'blue' | 'rainbow';

export type NumbersStep =
  | 'promotion'
  | 'demotion'
  | 'revival'
  | 'loser'
  | 'puchun'
  | `cd_${CountdownColor}_${number}`;

export type NumbersScenario = {
  id?: string;
  scenario_code?: string;
  code: string;
  label: string;
  description?: string;
  resultType: NumbersResultType;
  sequence: NumbersStep[];
  puchunIndex?: number | null;
  finalStage: NumbersStage;
  weight?: number;
  isActive?: boolean;
  isCustom?: boolean;
};

export type NumbersSettings = {
  id: string;
  isActive: boolean;
  lossRate: number;
  starDistribution: number[]; // length 12, sum ~100
  earlyMissEnabled: boolean;
  earlyMissMinCount: number;
  revivalRate: number;
  demotionEnabled: boolean;
  maxPromotions: number;
};

export type NumbersPlayScenario = {
  scenarioId: string | null;
  scenarioCode: string | null;
  sequence: NumbersStep[];
  finalStage: NumbersStage;
  resultType: NumbersResultType;
};
