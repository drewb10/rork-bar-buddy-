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
      user_profiles: {
        Row: {
          id: string
          username: string
          user_id: string
          ranking: string
          total_nights_out: number
          total_bars_hit: number
          profile_pic: string | null
          first_name: string
          last_name: string
          email: string | null
          join_date: string
          drunk_scale_ratings: number[]
          last_night_out_date: string | null
          last_drunk_scale_date: string | null
          has_completed_onboarding: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          user_id: string
          ranking?: string
          total_nights_out?: number
          total_bars_hit?: number
          profile_pic?: string | null
          first_name: string
          last_name: string
          email?: string | null
          join_date?: string
          drunk_scale_ratings?: number[]
          last_night_out_date?: string | null
          last_drunk_scale_date?: string | null
          has_completed_onboarding?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          user_id?: string
          ranking?: string
          total_nights_out?: number
          total_bars_hit?: number
          profile_pic?: string | null
          first_name?: string
          last_name?: string
          email?: string | null
          join_date?: string
          drunk_scale_ratings?: number[]
          last_night_out_date?: string | null
          last_drunk_scale_date?: string | null
          has_completed_onboarding?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      friends: {
        Row: {
          id: string
          user_id: string
          friend_user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_user_id?: string
          created_at?: string
        }
      }
      friend_requests: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          status: 'pending' | 'accepted' | 'declined'
          sent_at: string
          responded_at: string | null
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          status?: 'pending' | 'accepted' | 'declined'
          sent_at?: string
          responded_at?: string | null
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          status?: 'pending' | 'accepted' | 'declined'
          sent_at?: string
          responded_at?: string | null
        }
      }
      bingo_completions: {
        Row: {
          id: string
          user_id: string
          task_id: string
          completed_at: string
          session_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          task_id: string
          completed_at?: string
          session_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: string
          completed_at?: string
          session_id?: string | null
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
      bingo_card_completions: {
        Row: {
          id: string
          user_id: string
          completed_at: string
          session_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          completed_at?: string
          session_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          completed_at?: string
          session_id?: string | null
        }
      }
      chat_sessions: {
        Row: {
          id: string
          user_id: string
          venue_id: string
          anonymous_name: string
          created_at: string
          last_active: string
        }
        Insert: {
          id?: string
          user_id: string
          venue_id: string
          anonymous_name: string
          created_at?: string
          last_active?: string
        }
        Update: {
          id?: string
          user_id?: string
          venue_id?: string
          anonymous_name?: string
          created_at?: string
          last_active?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          venue_id: string
          content: string
          likes: number
          timestamp: string
          is_flagged: boolean
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          venue_id: string
          content: string
          likes?: number
          timestamp?: string
          is_flagged?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          venue_id?: string
          content?: string
          likes?: number
          timestamp?: string
          is_flagged?: boolean
          created_at?: string
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