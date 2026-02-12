export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export type ScenarioPhase = 'pre_story' | 'chance' | 'main_story' | 'reversal';

export type Database = {
  public: {
    Tables: {
      user_sessions: {
        Row: {
          id: string;
          session_token: string;
          metadata: Json;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          session_token: string;
          metadata?: Json;
          created_at?: string;
          expires_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['user_sessions']['Row']>;
        Relationships: [];
      };
      characters: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          expectation_level: number;
          thumbnail_url: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          expectation_level?: number;
          thumbnail_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['characters']['Row']>;
        Relationships: [];
      };
      cards: {
        Row: {
          id: string;
          character_id: string;
          card_name: string;
          star_level: number;
          rarity: 'N' | 'R' | 'SR' | 'SSR' | 'UR' | 'LR';
          card_image_url: string;
          description: string | null;
          has_reversal: boolean;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          character_id: string;
          card_name: string;
          star_level: number;
          rarity: 'N' | 'R' | 'SR' | 'SSR' | 'UR' | 'LR';
          card_image_url: string;
          description?: string | null;
          has_reversal?: boolean;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['cards']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'cards_character_id_fkey';
            columns: ['character_id'];
            referencedRelation: 'characters';
            referencedColumns: ['id'];
          }
        ];
      };
      pre_stories: {
        Row: {
          id: string;
          character_id: string;
          pattern: string;
          scene_order: number;
          video_url: string;
          duration_seconds: number;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          character_id: string;
          pattern: string;
          scene_order?: number;
          video_url: string;
          duration_seconds?: number;
          description?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['pre_stories']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'pre_stories_character_id_fkey';
            columns: ['character_id'];
            referencedRelation: 'characters';
            referencedColumns: ['id'];
          }
        ];
      };
      chance_scenes: {
        Row: {
          id: string;
          character_id: string;
          pattern: string;
          video_url: string;
          duration_seconds: number;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          character_id: string;
          pattern: string;
          video_url: string;
          duration_seconds?: number;
          description?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['chance_scenes']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'chance_scenes_character_id_fkey';
            columns: ['character_id'];
            referencedRelation: 'characters';
            referencedColumns: ['id'];
          }
        ];
      };
      video_assets: {
        Row: {
          id: string;
          label: string;
          storage_path: string;
          thumbnail_url: string | null;
          duration_seconds: number;
          aspect_ratio: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          label: string;
          storage_path: string;
          thumbnail_url?: string | null;
          duration_seconds?: number;
          aspect_ratio?: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['video_assets']['Row']>;
        Relationships: [];
      };
      scenarios: {
        Row: {
          id: string;
          card_id: string;
          phase: ScenarioPhase;
          scene_order: number;
          video_asset_id: string | null;
          video_url: string | null;
          duration_seconds: number;
          telop_text: string | null;
          telop_type: 'neutral' | 'chance' | 'win' | 'lose' | 'reversal' | 'epic';
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          card_id: string;
          phase: ScenarioPhase;
          scene_order?: number;
          video_asset_id?: string | null;
          video_url?: string | null;
          duration_seconds?: number;
          telop_text?: string | null;
          telop_type?: 'neutral' | 'chance' | 'win' | 'lose' | 'reversal' | 'epic';
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['scenarios']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'scenarios_card_id_fkey';
            columns: ['card_id'];
            referencedRelation: 'cards';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scenarios_video_asset_id_fkey';
            columns: ['video_asset_id'];
            referencedRelation: 'video_assets';
            referencedColumns: ['id'];
          }
        ];
      };
      gacha_config: {
        Row: {
          id: string;
          slug: string;
          rtp_config: Json;
          reversal_rates: Json;
          character_weights: Json;
          created_at: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          rtp_config?: Json;
          reversal_rates?: Json;
          character_weights?: Json;
          created_at?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['gacha_config']['Row']>;
        Relationships: [];
      };
      gacha_results: {
        Row: {
          id: string;
          user_session_id: string;
          character_id: string;
          card_id: string | null;
          star_level: number;
          had_reversal: boolean;
          scenario_snapshot: Json;
          card_awarded: boolean;
          metadata: Json;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_session_id: string;
          character_id: string;
          card_id?: string | null;
          star_level: number;
          had_reversal?: boolean;
          scenario_snapshot?: Json;
          card_awarded?: boolean;
          metadata?: Json;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['gacha_results']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'gacha_results_user_session_id_fkey';
            columns: ['user_session_id'];
            referencedRelation: 'user_sessions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'gacha_results_character_id_fkey';
            columns: ['character_id'];
            referencedRelation: 'characters';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'gacha_results_card_id_fkey';
            columns: ['card_id'];
            referencedRelation: 'cards';
            referencedColumns: ['id'];
          }
        ];
      };
      card_collection: {
        Row: {
          id: string;
          user_session_id: string;
          card_id: string;
          obtained_at: string;
          gacha_result_id: string | null;
        };
        Insert: {
          id?: string;
          user_session_id: string;
          card_id: string;
          obtained_at?: string;
          gacha_result_id?: string | null;
        };
        Update: Partial<Database['public']['Tables']['card_collection']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'card_collection_user_session_id_fkey';
            columns: ['user_session_id'];
            referencedRelation: 'user_sessions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'card_collection_card_id_fkey';
            columns: ['card_id'];
            referencedRelation: 'cards';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'card_collection_gacha_result_id_fkey';
            columns: ['gacha_result_id'];
            referencedRelation: 'gacha_results';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      scenario_phase: ScenarioPhase;
    };
  };
};

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
