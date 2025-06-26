export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          phone: string | null
          email: string | null
          xp: number
          nights_out: number
          bars_hit: number
          drunk_scale_ratings: number[]
          total_shots: number
          total_scoop_and_scores: number
          total_beers: number
          total_beer_towers: number
          total_funnels: number
          total_shotguns: number
          pool_games_won: number
          dart_games_won: number
          photos_taken: number
          profile_picture: string | null
          visited_bars: string[]
          xp_activities: Json
          has_completed_onboarding: boolean
          daily_stats: Json
          last_night_out_date: string | null
          last_drunk_scale_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          phone?: string | null
          email?: string | null
          xp?: number
          nights_out?: number
          bars_hit?: number
          drunk_scale_ratings?: number[]
          total_shots?: number
          total_scoop_and_scores?: number
          total_beers?: number
          total_beer_towers?: number
          total_funnels?: number
          total_shotguns?: number
          pool_games_won?: number
          dart_games_won?: number
          photos_taken?: number
          profile_picture?: string | null
          visited_bars?: string[]
          xp_activities?: Json
          has_completed_onboarding?: boolean
          daily_stats?: Json
          last_night_out_date?: string | null
          last_drunk_scale_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          phone?: string | null
          email?: string | null
          xp?: number
          nights_out?: number
          bars_hit?: number
          drunk_scale_ratings?: number[]
          total_shots?: number
          total_scoop_and_scores?: number
          total_beers?: number
          total_beer_towers?: number
          total_funnels?: number
          total_shotguns?: number
          pool_games_won?: number
          dart_games_won?: number
          photos_taken?: number
          profile_picture?: string | null
          visited_bars?: string[]
          xp_activities?: Json
          has_completed_onboarding?: boolean
          daily_stats?: Json
          last_night_out_date?: string | null
          last_drunk_scale_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      daily_stats: {
        Row: {
          id: string
          user_id: string
          date: string
          drunk_scale: number | null
          beers: number
          shots: number
          scoop_and_scores: number
          beer_towers: number
          funnels: number
          shotguns: number
          pool_games_won: number
          dart_games_won: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          drunk_scale?: number | null
          beers?: number
          shots?: number
          scoop_and_scores?: number
          beer_towers?: number
          funnels?: number
          shotguns?: number
          pool_games_won?: number
          dart_games_won?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          drunk_scale?: number | null
          beers?: number
          shots?: number
          scoop_and_scores?: number
          beer_towers?: number
          funnels?: number
          shotguns?: number
          pool_games_won?: number
          dart_games_won?: number
          created_at?: string
          updated_at?: string
        }
      }
      friends: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          created_at?: string
        }
      }
      friend_requests: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          status: 'pending' | 'accepted' | 'declined'
          created_at: string
          responded_at: string | null
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
          responded_at?: string | null
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
          responded_at?: string | null
        }
      }
      venue_interactions: {
        Row: {
          id: string
          user_id: string
          venue_id: string
          interaction_type: string
          arrival_time: string | null
          timestamp: string
          session_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          venue_id: string
          interaction_type: string
          arrival_time?: string | null
          timestamp?: string
          session_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          venue_id?: string
          interaction_type?: string
          arrival_time?: string | null
          timestamp?: string
          session_id?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}