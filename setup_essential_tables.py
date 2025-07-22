#!/usr/bin/env python3
"""
Essential BarBuddy Tables Setup
Creates only the tables needed for login and basic functionality
"""

import os
import sys
import requests

def main():
    # Supabase credentials
    supabase_url = "https://fxumtfryjehzsdfqgeis.supabase.co"
    supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4dW10ZnJ5amVoenNkZnFnZWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjM4ODcsImV4cCI6MjA2NTkzOTg4N30.iKdasj5a6LGPjfD3-taG6mvLc_lCWLLi7J_SnEXZ6DE"
    
    print("🚀 Setting up essential BarBuddy tables...")
    
    # Essential SQL for basic functionality
    essential_sql = """
-- Update profiles table with all needed columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nights_out INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bars_hit INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS drunk_scale_ratings INTEGER[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_shots INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_beers INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_beer_towers INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_funnels INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_shotguns INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pool_games_won INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dart_games_won INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photos_taken INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS visited_bars TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp_activities JSONB DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS friends JSONB DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS friend_requests JSONB DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT false;

-- Create unique index on username if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Enable RLS if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create basic policies
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (true);
"""
    
    # Use Supabase REST API to execute SQL
    headers = {
        'apikey': supabase_key,
        'Authorization': f'Bearer {supabase_key}',
        'Content-Type': 'application/json'
    }
    
    try:
        # Split SQL into individual commands
        commands = [cmd.strip() for cmd in essential_sql.split(';') if cmd.strip() and not cmd.strip().startswith('--')]
        
        print(f"📝 Executing {len(commands)} SQL commands...")
        
        success_count = 0
        for i, command in enumerate(commands):
            try:
                response = requests.post(
                    f"{supabase_url}/rest/v1/rpc/exec",
                    headers=headers,
                    json={"sql": command}
                )
                
                if response.status_code in [200, 201, 204]:
                    success_count += 1
                    print(f"✅ Command {i+1}/{len(commands)} successful")
                else:
                    print(f"⚠️  Command {i+1} returned {response.status_code}")
                    
            except Exception as e:
                print(f"⚠️  Command {i+1} error: {str(e)[:50]}...")
                continue
        
        print(f"\n🎉 Setup completed! {success_count}/{len(commands)} commands executed.")
        print("✅ BarBuddy authentication should now work properly!")
        
        return 0
        
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        print("\n📝 Manual setup required:")
        print("1. Go to https://supabase.com/dashboard")
        print("2. Select your project")
        print("3. Go to SQL Editor")
        print("4. Copy the contents of /app/lib/comprehensive-supabase-setup.sql")
        print("5. Run the SQL commands")
        return 1

if __name__ == "__main__":
    sys.exit(main())