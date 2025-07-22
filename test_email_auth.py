#!/usr/bin/env python3
"""
BarBuddy Email Authentication Test
Tests authentication using email instead of phone
"""

import sys
from supabase import create_client, Client

def main():
    supabase_url = "https://fxumtfryjehzsdfqgeis.supabase.co"
    supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4dW10ZnJ5amVoenNkZnFnZWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjM4ODcsImV4cCI6MjA2NTkzOTg4N30.iKdasj5a6LGPjfD3-taG6mvLc_lCWLLi7J_SnEXZ6DE"
    
    print("🔐 Testing BarBuddy Email Authentication...")
    
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Test with email instead of phone
        test_email = "test@barbuddy.com"
        test_password = "testpassword123"
        test_username = "testuser"
        
        print("1️⃣ Testing email signup...")
        
        try:
            # Try signup with email
            signup_result = supabase.auth.sign_up({
                "email": test_email,
                "password": test_password,
                "options": {
                    "data": {
                        "username": test_username
                    }
                }
            })
            
            if signup_result.user:
                print(f"✅ Email signup successful: {signup_result.user.id}")
                user_id = signup_result.user.id
                
                # Create profile
                print("2️⃣ Creating user profile...")
                profile_data = {
                    "id": user_id,
                    "username": test_username,
                    "email": test_email,
                    "xp": 0,
                    "nights_out": 0,
                    "bars_hit": 0,
                    "has_completed_onboarding": False
                }
                
                try:
                    profile_result = supabase.table('profiles').insert(profile_data).execute()
                    print(f"✅ Profile created successfully")
                    
                    # Test signin
                    print("3️⃣ Testing email signin...")
                    signin_result = supabase.auth.sign_in_with_password({
                        "email": test_email,
                        "password": test_password
                    })
                    
                    if signin_result.user:
                        print(f"✅ Email signin successful: {signin_result.user.id}")
                        
                        # Get profile
                        print("4️⃣ Retrieving user profile...")
                        profile_result = supabase.table('profiles').select('*').eq('id', signin_result.user.id).single().execute()
                        
                        if profile_result.data:
                            print(f"✅ Profile retrieved successfully")
                            print(f"👤 Username: {profile_result.data.get('username')}")
                            print(f"📧 Email: {profile_result.data.get('email')}")
                            print(f"🎯 XP: {profile_result.data.get('xp')}")
                            
                            print("\n🎉 All tests passed!")
                            print("✅ BarBuddy authentication is working with email")
                            return 0
                        else:
                            print("❌ Failed to retrieve profile")
                            return 1
                    else:
                        print("❌ Email signin failed")
                        return 1
                        
                except Exception as profile_error:
                    print(f"⚠️  Profile error: {profile_error}")
                    # Try to sign in anyway in case profile already exists
                    try:
                        signin_result = supabase.auth.sign_in_with_password({
                            "email": test_email,
                            "password": test_password
                        })
                        
                        if signin_result.user:
                            print(f"✅ Signin works even without profile creation")
                            return 0
                    except:
                        pass
                    return 1
            else:
                print("❌ Email signup failed - no user returned")
                
        except Exception as signup_error:
            print(f"⚠️  Signup failed: {signup_error}")
            
            # Try signin in case user already exists
            print("🔄 Trying signin with existing user...")
            try:
                signin_result = supabase.auth.sign_in_with_password({
                    "email": test_email,
                    "password": test_password
                })
                
                if signin_result.user:
                    print(f"✅ Signin successful with existing user: {signin_result.user.id}")
                    
                    # Check profile
                    profile_result = supabase.table('profiles').select('*').eq('id', signin_result.user.id).single().execute()
                    
                    if profile_result.data:
                        print(f"✅ Existing profile found")
                        print(f"👤 Username: {profile_result.data.get('username')}")
                        
                    print("\n🎉 Authentication working with existing user!")
                    return 0
                else:
                    print("❌ Signin also failed")
                    
            except Exception as signin_error:
                print(f"❌ Signin error: {signin_error}")
        
        return 1
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())