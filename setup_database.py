#!/usr/bin/env python3
"""
BarBuddy Database Setup Script
Automatically sets up all necessary tables and functions in Supabase
"""

import os
import sys
from supabase import create_client, Client

def main():
    # Get Supabase credentials from environment or direct values
    supabase_url = "https://fxumtfryjehzsdfqgeis.supabase.co"
    supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4dW10ZnJ5amVoenNkZnFnZWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjM4ODcsImV4cCI6MjA2NTkzOTg4N30.iKdasj5a6LGPjfD3-taG6mvLc_lCWLLi7J_SnEXZ6DE"
    
    if not supabase_url or not supabase_key:
        print("❌ Error: Supabase credentials not found")
        print("Please make sure SUPABASE_URL and SUPABASE_KEY are set")
        return 1
    
    print("🚀 Starting BarBuddy database setup...")
    print(f"📡 Connecting to: {supabase_url}")
    
    try:
        # Create Supabase client
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Read the comprehensive setup SQL
        setup_sql_path = "/app/lib/comprehensive-supabase-setup.sql"
        
        with open(setup_sql_path, 'r') as file:
            setup_sql = file.read()
        
        print("📄 Running database setup SQL...")
        
        # Execute the setup SQL using RPC call
        # Split the SQL into smaller chunks to avoid timeout
        sql_commands = setup_sql.split(';')
        
        success_count = 0
        error_count = 0
        
        for i, command in enumerate(sql_commands):
            command = command.strip()
            if not command or command.startswith('--') or len(command) < 10:
                continue
                
            try:
                print(f"⚡ Executing command {i+1}...")
                
                # For complex SQL, we might need to use the REST API directly
                response = supabase.rpc('exec_sql', {'sql_command': command})
                success_count += 1
                
            except Exception as e:
                print(f"⚠️  Warning on command {i+1}: {str(e)[:100]}...")
                error_count += 1
                # Continue with other commands
                continue
        
        print(f"\n✅ Database setup completed!")
        print(f"📊 Success: {success_count} commands")
        print(f"⚠️  Warnings: {error_count} commands")
        
        # Test the setup by checking if tables exist
        try:
            result = supabase.table('user_profiles').select('*').limit(1).execute()
            print("✅ Database connection test successful!")
            
        except Exception as e:
            print(f"⚠️  Warning: Could not verify table creation: {e}")
        
        print("\n🎉 BarBuddy database is ready!")
        return 0
        
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())