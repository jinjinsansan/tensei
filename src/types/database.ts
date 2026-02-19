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
          app_user_id: string | null;
          last_seen_at: string;
        };
        Insert: {
          id?: string;
          session_token: string;
          metadata?: Json;
          created_at?: string;
          expires_at?: string | null;
          app_user_id?: string | null;
          last_seen_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_sessions']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'user_sessions_app_user_id_fkey';
            columns: ['app_user_id'];
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          }
        ];
      };
      app_users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          display_name: string | null;
          avatar_url: string | null;
          metadata: Json;
          is_admin: boolean;
          is_blocked: boolean;
          deleted_at: string | null;
          login_bonus_last_claim_at: string | null;
          login_bonus_streak: number;
          referral_blocked: boolean;
          referred_by_user_id: string | null;
          created_at: string;
          updated_at: string;
          last_login_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          display_name?: string | null;
          avatar_url?: string | null;
          metadata?: Json;
          is_admin?: boolean;
          is_blocked?: boolean;
          deleted_at?: string | null;
          login_bonus_last_claim_at?: string | null;
          login_bonus_streak?: number;
          referral_blocked?: boolean;
          referred_by_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['app_users']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'app_users_referred_by_user_id_fkey';
            columns: ['referred_by_user_id'];
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          }
        ];
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
      ticket_types: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          color_token: string | null;
          sort_order: number;
          purchasable: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          color_token?: string | null;
          sort_order?: number;
          purchasable?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['ticket_types']['Row']>;
        Relationships: [];
      };
      user_tickets: {
        Row: {
          id: string;
          user_id: string;
          ticket_type_id: string;
          quantity: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ticket_type_id: string;
          quantity?: number;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_tickets']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'user_tickets_ticket_type_id_fkey';
            columns: ['ticket_type_id'];
            referencedRelation: 'ticket_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_tickets_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          }
        ];
      };
      ticket_purchase_history: {
        Row: {
          id: string;
          app_user_id: string;
          ticket_type_id: string;
          quantity: number;
          amount_cents: number;
          currency: string;
          payment_method: string;
          external_reference: string | null;
          status: string;
          note: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          app_user_id: string;
          ticket_type_id: string;
          quantity: number;
          amount_cents: number;
          currency?: string;
          payment_method?: string;
          external_reference?: string | null;
          status?: string;
          note?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['ticket_purchase_history']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'ticket_purchase_history_app_user_id_fkey';
            columns: ['app_user_id'];
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ticket_purchase_history_ticket_type_id_fkey';
            columns: ['ticket_type_id'];
            referencedRelation: 'ticket_types';
            referencedColumns: ['id'];
          }
        ];
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
          max_supply: number | null;
          current_supply: number;
          person_name: string | null;
          card_style: string | null;
          is_loss_card: boolean;
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
          max_supply?: number | null;
          current_supply?: number;
          person_name?: string | null;
          card_style?: string | null;
          is_loss_card?: boolean;
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
      rtp_settings: {
        Row: {
          star: number;
          probability: number;
          updated_at: string;
        };
        Insert: {
          star: number;
          probability: number;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['rtp_settings']['Row']>;
        Relationships: [];
      };
      donden_rate_settings: {
        Row: {
          star: number;
          rate: number;
          updated_at: string;
        };
        Insert: {
          star: number;
          rate: number;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['donden_rate_settings']['Row']>;
        Relationships: [];
      };
      tsuigeki_settings: {
        Row: {
          star: number;
          success_rate: number;
          card_count_on_success: number;
          bonus_third_rate: number | null;
          updated_at: string;
        };
        Insert: {
          star: number;
          success_rate: number;
          card_count_on_success?: number;
          bonus_third_rate?: number | null;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tsuigeki_settings']['Row']>;
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
      gacha_characters: {
        Row: {
          id: string;
          character_id: string;
          character_name: string;
          is_active: boolean;
          weight: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          character_id: string;
          character_name: string;
          is_active?: boolean;
          weight?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['gacha_characters']['Row']>;
        Relationships: [];
      };
      gacha_rtp_config: {
        Row: {
          id: string;
          character_id: string;
          loss_rate: number;
          rarity_n: number;
          rarity_r: number;
          rarity_sr: number;
          rarity_ssr: number;
          rarity_ur: number;
          rarity_lr: number;
          star_distribution: Json;
          donden_rate: number;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          character_id: string;
          loss_rate?: number;
          rarity_n?: number;
          rarity_r?: number;
          rarity_sr?: number;
          rarity_ssr?: number;
          rarity_ur?: number;
          rarity_lr?: number;
          star_distribution?: Json;
          donden_rate?: number;
          updated_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['gacha_rtp_config']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'gacha_rtp_config_character_id_fkey';
            columns: ['character_id'];
            referencedRelation: 'gacha_characters';
            referencedColumns: ['character_id'];
          }
        ];
      };
      gacha_global_config: {
        Row: {
          id: string;
          loss_rate: number;
          line_reward_points: number;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          loss_rate?: number;
          line_reward_points?: number;
          updated_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['gacha_global_config']['Row']>;
        Relationships: [];
      };
      line_link_states: {
        Row: {
          id: string;
          user_id: string;
          state: string;
          nonce: string;
          line_user_id: string | null;
          rewarded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          state: string;
          nonce: string;
          line_user_id?: string | null;
          rewarded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['line_link_states']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'line_link_states_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          }
        ];
      };
      gacha_history: {
        Row: {
          id: string;
          user_session_id: string | null;
          app_user_id: string | null;
          multi_session_id: string | null;
          star_level: number;
          scenario: Json;
          result: string | null;
          result_detail: string | null;
          had_reversal: boolean;
          gacha_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_session_id?: string | null;
          app_user_id?: string | null;
          multi_session_id?: string | null;
          star_level: number;
          scenario: Json;
          result?: string | null;
          result_detail?: string | null;
          had_reversal?: boolean;
          gacha_type?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['gacha_history']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'gacha_history_app_user_id_fkey';
            columns: ['app_user_id'];
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'gacha_history_multi_session_id_fkey';
            columns: ['multi_session_id'];
            referencedRelation: 'multi_gacha_sessions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'gacha_history_user_session_id_fkey';
            columns: ['user_session_id'];
            referencedRelation: 'user_sessions';
            referencedColumns: ['id'];
          }
        ];
      };
      multi_gacha_sessions: {
        Row: {
          id: string;
          app_user_id: string;
          total_pulls: number;
          pulls_completed: number;
          status: 'pending' | 'running' | 'completed' | 'error';
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          app_user_id: string;
          total_pulls: number;
          pulls_completed?: number;
          status?: 'pending' | 'running' | 'completed' | 'error';
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['multi_gacha_sessions']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'multi_gacha_sessions_app_user_id_fkey';
            columns: ['app_user_id'];
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          }
        ];
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
          app_user_id: string | null;
          history_id: string | null;
          obtained_via: string;
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
          app_user_id?: string | null;
          history_id?: string | null;
          obtained_via?: string;
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
          },
          {
            foreignKeyName: 'gacha_results_history_id_fkey';
            columns: ['history_id'];
            referencedRelation: 'gacha_history';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'gacha_results_app_user_id_fkey';
            columns: ['app_user_id'];
            referencedRelation: 'app_users';
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
          app_user_id: string | null;
        };
        Insert: {
          id?: string;
          user_session_id: string;
          card_id: string;
          obtained_at?: string;
          gacha_result_id?: string | null;
          app_user_id?: string | null;
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
          },
          {
            foreignKeyName: 'card_collection_app_user_id_fkey';
            columns: ['app_user_id'];
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          }
        ];
      };
      card_inventory: {
        Row: {
          id: string;
          app_user_id: string;
          card_id: string;
          serial_number: number;
          obtained_at: string;
          obtained_via: string;
          gacha_result_id: string | null;
        };
        Insert: {
          id?: string;
          app_user_id: string;
          card_id: string;
          serial_number: number;
          obtained_at?: string;
          obtained_via?: string;
          gacha_result_id?: string | null;
        };
        Update: Partial<Database['public']['Tables']['card_inventory']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'card_inventory_app_user_id_fkey';
            columns: ['app_user_id'];
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'card_inventory_card_id_fkey';
            columns: ['card_id'];
            referencedRelation: 'cards';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'card_inventory_gacha_result_id_fkey';
            columns: ['gacha_result_id'];
            referencedRelation: 'gacha_results';
            referencedColumns: ['id'];
          }
        ];
      };
      friend_requests: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          from_user_id: string;
          to_user_id: string;
          status?: 'pending' | 'accepted' | 'rejected' | 'cancelled';
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['friend_requests']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'friend_requests_from_user_id_fkey';
            columns: ['from_user_id'];
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'friend_requests_to_user_id_fkey';
            columns: ['to_user_id'];
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          }
        ];
      };
      friends: {
        Row: {
          id: string;
          user_id: string;
          friend_user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          friend_user_id: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['friends']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'friends_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'friends_friend_user_id_fkey';
            columns: ['friend_user_id'];
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          }
        ];
      };
      card_transfers: {
        Row: {
          id: string;
          card_inventory_id: string;
          from_user_id: string | null;
          to_user_id: string | null;
          created_at: string;
          note: string | null;
        };
        Insert: {
          id?: string;
          card_inventory_id: string;
          from_user_id: string;
          to_user_id: string;
          created_at?: string;
          note?: string | null;
        };
        Update: Partial<Database['public']['Tables']['card_transfers']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'card_transfers_card_inventory_id_fkey';
            columns: ['card_inventory_id'];
            referencedRelation: 'card_inventory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'card_transfers_from_user_id_fkey';
            columns: ['from_user_id'];
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'card_transfers_to_user_id_fkey';
            columns: ['to_user_id'];
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          }
        ];
      };
      mail_broadcasts: {
        Row: {
          id: string;
          subject: string;
          body_html: string;
          body_text: string;
          audience: string;
          target_user_id: string | null;
          sent_by: string | null;
          total_recipients: number;
          status: string;
          error_message: string | null;
          sent_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          subject: string;
          body_html: string;
          body_text: string;
          audience: string;
          target_user_id?: string | null;
          sent_by?: string | null;
          total_recipients?: number;
          status?: string;
          error_message?: string | null;
          sent_at?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['mail_broadcasts']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'mail_broadcasts_sent_by_fkey';
            columns: ['sent_by'];
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'mail_broadcasts_target_user_id_fkey';
            columns: ['target_user_id'];
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          }
        ];
      };
      mail_broadcast_logs: {
        Row: {
          id: string;
          broadcast_id: string;
          user_id: string | null;
          email: string;
          status: string;
          sent_at: string | null;
          error_message: string | null;
          metadata: Json;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          broadcast_id: string;
          user_id?: string | null;
          email: string;
          status?: string;
          sent_at?: string | null;
          error_message?: string | null;
          metadata?: Json;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['mail_broadcast_logs']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'mail_broadcast_logs_broadcast_id_fkey';
            columns: ['broadcast_id'];
            referencedRelation: 'mail_broadcasts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'mail_broadcast_logs_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          }
        ];
      };
      user_notifications: {
        Row: {
          id: string;
          user_id: string;
          category: string;
          title: string;
          message: string;
          link_url: string | null;
          metadata: Json;
          broadcast_id: string | null;
          read_at: string | null;
          emailed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category?: string;
          title: string;
          message: string;
          link_url?: string | null;
          metadata?: Json;
          broadcast_id?: string | null;
          read_at?: string | null;
          emailed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_notifications']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'user_notifications_broadcast_id_fkey';
            columns: ['broadcast_id'];
            referencedRelation: 'mail_broadcasts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_notifications_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          }
        ];
      };
      password_reset_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          expires_at: string;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          expires_at: string;
          used_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['password_reset_tokens']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'password_reset_tokens_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          }
        ];
      };
      referral_codes: {
        Row: {
          id: string;
          app_user_id: string;
          code: string;
          usage_limit: number | null;
          uses: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          app_user_id: string;
          code: string;
          usage_limit?: number | null;
          uses?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['referral_codes']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'referral_codes_app_user_id_fkey';
            columns: ['app_user_id'];
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          }
        ];
      };
      referral_claims: {
        Row: {
          id: string;
          referral_code_id: string;
          invited_user_id: string;
          referrer_reward_tickets: number;
          referee_reward_tickets: number;
          status: 'pending' | 'granted' | 'cancelled';
          granted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          referral_code_id: string;
          invited_user_id: string;
          referrer_reward_tickets?: number;
          referee_reward_tickets?: number;
          status?: 'pending' | 'granted' | 'cancelled';
          granted_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['referral_claims']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'referral_claims_invited_user_id_fkey';
            columns: ['invited_user_id'];
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'referral_claims_referral_code_id_fkey';
            columns: ['referral_code_id'];
            referencedRelation: 'referral_codes';
            referencedColumns: ['id'];
          }
        ];
      };
      referral_settings: {
        Row: {
          id: string;
          referrer_ticket_amount: number;
          referee_ticket_amount: number;
          ticket_code: string;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          referrer_ticket_amount?: number;
          referee_ticket_amount?: number;
          ticket_code?: string;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['referral_settings']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'referral_settings_updated_by_fkey';
            columns: ['updated_by'];
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          }
        ];
      };
      line_link_requests: {
        Row: {
          id: string;
          app_user_id: string;
          state_token: string;
          linked: boolean;
          created_at: string;
          linked_at: string | null;
        };
        Insert: {
          id?: string;
          app_user_id: string;
          state_token: string;
          linked?: boolean;
          created_at?: string;
          linked_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['line_link_requests']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'line_link_requests_app_user_id_fkey';
            columns: ['app_user_id'];
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          }
        ];
      };
      presentation_config: {
        Row: {
          id: string;
          config_type: string;
          rarity: string;
          probabilities: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          config_type: string;
          rarity: string;
          probabilities: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          config_type?: string;
          rarity?: string;
          probabilities?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      countdown_patterns: {
        Row: {
          id: string;
          pattern_id: string;
          name: string;
          grade: string;
          steps: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pattern_id: string;
          name: string;
          grade: string;
          steps: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          pattern_id?: string;
          name?: string;
          grade?: string;
          steps?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_gacha_summary_stats: {
        Args: Record<PropertyKey, never>;
        Returns: {
          total_plays: number | null;
          reversal_count: number | null;
          last_play: string | null;
          average_star: number | null;
        }[];
      };
      get_gacha_star_counts: {
        Args: Record<PropertyKey, never>;
        Returns: {
          star_level: number | null;
          total: number | null;
        }[];
      };
      get_gacha_card_leaderboard: {
        Args: {
          limit_count?: number | null;
        };
        Returns: {
          card_id: string | null;
          card_name: string | null;
          rarity: string | null;
          star_level: number | null;
          total: number | null;
        }[];
      };
      get_admin_user_metrics: {
        Args: {
          target_user_ids?: string[] | null;
        };
        Returns: {
          user_id: string | null;
          total_pulls: number | null;
          last_gacha_at: string | null;
          last_card_name: string | null;
          last_card_rarity: string | null;
          pending_results: number | null;
          error_results: number | null;
          last_error_at: string | null;
          last_error_detail: string | null;
          last_result_status: string | null;
        }[];
      };
      next_card_serial: {
        Args: {
          target_card_id: string;
        };
        Returns: number;
      };
    };
    Enums: {
      scenario_phase: ScenarioPhase;
    };
  };
};

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
