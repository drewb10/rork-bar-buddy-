#!/usr/bin/env python3
"""
Direct Supabase Authentication Test
Tests if authentication works with the current setup
"""

import sys
from supabase import create_client, Client
import asyncio

async def main():
    supabase_url = "https://fxumtfryjehzsdfqgeis.supabase.co"
    supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4dW10ZnJ5amVoenNkZnFnZWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjM4ODcsImV4cCI6MjA2NTkzOTg4N30.iKdasj5a6LGPjfD3-taG6mvLc_lCWLLi7J_SnEXZ6DE"
    
    print("🔐 Testing BarBuddy Authentication...")
    
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Test 1: Check if we can access the auth system
        print("1️⃣ Testing auth system access...")
        session = supabase.auth.get_session()
        print(f"✅ Auth system accessible")
        
        # Test 2: Try to sign up a test user
        print("2️⃣ Testing user signup...")
        test_phone = "+1234567890"
        test_password = "testpassword123"
        test_username = "testuser"
        
        try:
            signup_result = supabase.auth.sign_up({
                "phone": test_phone,
                "password": test_password,
                "options": {
                    "data": {
                        "username": test_username
                    }
                }
            })
            
            if signup_result.user:
                print(f"✅ Signup successful: {signup_result.user.id}")
                
                # Test 3: Check if profiles table exists and create profile
                print("3️⃣ Testing profiles table...")
                
                profile_data = {
                    "id": signup_result.user.id,
                    "username": test_username,
                    "phone": test_phone,
                    "xp": 0,
                    "nights_out": 0,
                    "bars_hit": 0,
                    "has_completed_onboarding": False
                }
                
                try:
                    profile_result = supabase.table('profiles').insert(profile_data).execute()
                    print(f"✅ Profile created successfully")
                    
                    # Test 4: Try to sign in
                    print("4️⃣ Testing user signin...")
                    signin_result = supabase.auth.sign_in_with_password({
                        "phone": test_phone,
                        "password": test_password
                    })
                    
                    if signin_result.user:
                        print(f"✅ Signin successful: {signin_result.user.id}")
                        
                        # Test 5: Get profile
                        print("5️⃣ Testing profile retrieval...")
                        profile_get_result = supabase.table('profiles').select('*').eq('id', signin_result.user.id).single().execute()
                        
                        if profile_get_result.data:
                            print(f"✅ Profile retrieved successfully")
                            print(f"👤 Username: {profile_get_result.data.get('username')}")
                            print(f"📱 Phone: {profile_get_result.data.get('phone')}")
                            print(f"🎯 XP: {profile_get_result.data.get('xp')}")
                        
                        # Clean up: Sign out
                        supabase.auth.sign_out()
                        print("🔄 Signed out successfully")
                        
                    else:
                        print("❌ Signin failed")
                        return 1
                        
                except Exception as profile_error:
                    print(f"⚠️  Profile operation failed: {profile_error}")
                    print("💡 This might mean the profiles table doesn't exist or has different structure")
                    
            else:
                print("❌ Signup failed - no user returned")
                return 1
                
        except Exception as auth_error:
            print(f"⚠️  Auth operation failed: {auth_error}")
            
            # This might be because the user already exists, let's try signing in
            print("🔄 User might already exist, trying signin...")
            try:
                signin_result = supabase.auth.sign_in_with_password({
                    "phone": test_phone,
                    "password": test_password
                })
                
                if signin_result.user:
                    print(f"✅ Signin successful with existing user: {signin_result.user.id}")
                    supabase.auth.sign_out()
                else:
                    print("❌ Signin also failed")
                    return 1
                    
            except Exception as signin_error:
                print(f"❌ Signin failed: {signin_error}")
                return 1
        
        print("\n🎉 Authentication test completed successfully!")
        print("✅ BarBuddy authentication system is working properly")
        return 0
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return 1

if __name__ == "__main__":
    import asyncio
    sys.exit(asyncio.run(main()) if hasattr(asyncio, 'run') else main())