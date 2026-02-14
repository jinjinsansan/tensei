import type { Tables } from '@/types/database';
import type { GachaResult } from '@/lib/gacha/common/types';

export type TelopType = 'neutral' | 'chance' | 'win' | 'lose' | 'reversal' | 'epic';

export type VideoSegment = {
  id: string;
  phase: 'pre_story' | 'chance' | 'main_story' | 'reversal';
  order: number;
  videoUrl: string;
  durationSeconds: number;
  telopText?: string | null;
  telopType?: TelopType;
};

export type StoryPayload = {
  starLevel: number;
  hadReversal: boolean;
  characterId: string;
  cardId: string;
  preStory: VideoSegment[];
  chance: VideoSegment[];
  mainStory: VideoSegment[];
  reversalStory: VideoSegment[];
  finalCard: Pick<
    Tables<'cards'>,
    'id' | 'card_name' | 'rarity' | 'star_level' | 'card_image_url' | 'has_reversal'
  >;
};

export type GachaEngineResult = {
  story: StoryPayload;
  gachaResult: GachaResult;
  resultRow: Tables<'gacha_results'>;
  card: Tables<'cards'>;
  character: Tables<'characters'>;
};
