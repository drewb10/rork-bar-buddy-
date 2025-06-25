import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  const isConfigured = supabaseUrl !== 'https://your-project.supabase.co' && 
         supabaseAnonKey !== 'your-anon-key' &&
         supabaseUrl.includes('supabase.co') &&
         supabaseAnonKey.length > 50;
  
  if (!isConfigured) {
    console.warn('🔧 Supabase not configured. Please check your .env file and ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set correctly.');
  }
  
  return isConfigured;
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'barbuddy-app',
    },
  },
});

// Helper function to get current user ID
export const getCurrentUserId = async () => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  } catch (error) {
    console.warn('Error getting current user ID:', error);
    return null;
  }
};

// Helper function to ensure user is authenticated
export const ensureAuth = async () => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user;
};

// Test connection function
export const testSupabaseConnection = async () => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }
  
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, message: 'Connection successful' };
  } catch (error) {
    return { success: false, error: 'Connection failed' };
  }
};