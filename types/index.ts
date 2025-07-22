export interface Friend {
  id: string;
  username: string;
  phone: string;
  email?: string | null;
  xp: number;
  nights_out: number;
  bars_hit: number;
  rank_title: string;
  created_at: string;
}

export interface FriendRequest {
  id: string;
  from_user_id: string;
  from_username: string;
  from_user_rank: string;
  created_at: string;
}

export interface XPActivity {
  id: string;
  type: 'visit_new_bar' | 'participate_event' | 'bring_friend' | 'complete_night_out' | 'special_achievement' | 'live_music' | 'featured_drink' | 'bar_game' | 'photo_taken' | 'shots' | 'beers' | 'beer_towers' | 'funnels' | 'shotguns' | 'pool_games' | 'dart_games' | 'drunk_scale_submission' | 'like_bar' | 'check_in' | 'new_member_bonus' | 'scoop_and_scores';
  xpAwarded: number;
  timestamp: string;
  description: string;
}

export interface UserProfile {
  id: string;
  username: string;
  phone?: string;
  email?: string | null;
  xp: number;
  nights_out: number;
  bars_hit: number;
  drunk_scale_ratings: number[];
  last_night_out_date?: string | null;
  last_drunk_scale_date?: string | null;
  profile_picture?: string | null;
  friends?: Friend[];
  friend_requests?: FriendRequest[];
  xp_activities: XPActivity[];
  visited_bars: string[];
  total_shots: number;
  total_beers: number;
  total_beer_towers: number;
  total_funnels: number;
  total_shotguns: number;
  total_scoop_and_scores?: number;
  pool_games_won: number;
  dart_games_won: number;
  photos_taken: number;
  has_completed_onboarding: boolean;
  created_at: string;
  updated_at: string;
}