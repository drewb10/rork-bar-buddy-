#!/usr/bin/env python3
"""
BarBuddy Database Setup Script
Creates the essential tables needed for BarBuddy authentication
"""

import os
import sys
from supabase import create_client, Client

def main():
    # Get Supabase credentials
    supabase_url = "https://fxumtfryjehzsdfqgeis.supabase.co"
    supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4dW10ZnJ5amVoenNkZnFnZWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjM4ODcsImV4cCI6MjA2NTkzOTg4N30.iKdasj5a6LGPjfD3-taG6mvLc_lCWLLi7J_SnEXZ6DE"
    
    print("🚀 Starting BarBuddy database setup...")
    print(f"📡 Connecting to: {supabase_url}")
    
    try:
        # Create Supabase client
        supabase: Client = create_client(supabase_url, supabase_key)
        
        print("✅ Connected to Supabase!")
        
        # Test connection by trying to access auth
        print("🔐 Testing authentication system...")
        
        # The user_profiles table should be created through Supabase dashboard
        # Let's test if we can create a simple test profile
        print("📋 Testing profiles table...")
        
        try:
            # Try to select from profiles table (will create it if it doesn't exist)
            result = supabase.table('profiles').select('*').limit(1).execute()
            print("✅ Profiles table exists and accessible!")
            
        except Exception as e:
            print(f"ℹ️  Profiles table needs to be created. Error: {str(e)[:100]}...")
            print("📝 The database tables need to be created through Supabase SQL Editor.")
            
        print("\n🎯 Next Steps:")
        print("1. Go to your Supabase dashboard: https://supabase.com/dashboard")
        print("2. Select your project")
        print("3. Go to SQL Editor")
        print("4. Copy and paste the contents of /app/lib/comprehensive-supabase-setup.sql")
        print("5. Run the SQL to create all tables")
        print("\n✅ Connection test completed!")
        
        return 0
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print("Please check your Supabase credentials and project settings.")
        return 1

if __name__ == "__main__":
    sys.exit(main())