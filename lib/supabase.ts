import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '');
};

// Only create client if configured
export const supabase = isSupabaseConfigured() 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

// Safe wrapper for supabase operations
export const safeSupabase = {
  auth: {
    getUser: async () => {
      if (!supabase) return { data: { user: null }, error: new Error('Supabase not configured') };
      return supabase.auth.getUser();
    },
    getSession: async () => {
      if (!supabase) return { data: { session: null }, error: new Error('Supabase not configured') };
      return supabase.auth.getSession();
    },
    signUp: async (credentials: any) => {
      if (!supabase) return { data: { user: null, session: null }, error: new Error('Supabase not configured') };
      return supabase.auth.signUp(credentials);
    },
    signInWithPassword: async (credentials: any) => {
      if (!supabase) return { data: { user: null, session: null }, error: new Error('Supabase not configured') };
      return supabase.auth.signInWithPassword(credentials);
    },
    signOut: async () => {
      if (!supabase) return { error: new Error('Supabase not configured') };
      return supabase.auth.signOut();
    },
    onAuthStateChange: (callback: any) => {
      if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
      return supabase.auth.onAuthStateChange(callback);
    },
    refreshSession: async () => {
      if (!supabase) return { data: { session: null }, error: new Error('Supabase not configured') };
      return supabase.auth.refreshSession();
    }
  },
  from: (table: string) => {
    if (!supabase) {
      return {
        select: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }),
        insert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }),
        upsert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        delete: () => ({ eq: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) })
      };
    }
    return supabase.from(table);
  }
};