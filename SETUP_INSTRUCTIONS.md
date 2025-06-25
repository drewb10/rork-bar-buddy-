# 🚀 Quick Supabase Setup Instructions

## ⚠️ CRITICAL: Fix "Database error saving new user"

If you're getting the error "Database error saving new user", this is caused by restrictive RLS policies. Follow these steps:

## Step 1: Run the Latest RLS Policy Fix
1. Go to your Supabase dashboard → SQL Editor
2. Click "New Query"
3. Copy the entire contents of `supabase/migrations/20250625003000_fix_rls_policy_final.sql`
4. Paste it and click "Run"
5. You should see "RLS policy test successful - signup should now work"

## Step 2: Verify Your Current RLS Policies
1. In Supabase dashboard, go to Authentication → Policies
2. Find the `profiles` table
3. You should see these policies:
   - ✅ "Allow profile creation during signup" (INSERT)
   - ✅ "Allow viewing all profiles" (SELECT)  
   - ✅ "Allow users to update own profile" (UPDATE)
   - ✅ "Allow users to delete own profile" (DELETE)

## Step 3: Remove Problematic Policies
If you see this policy, **DELETE IT**:
```sql
❌ "Allow users to insert their own profile" with check ((select auth.uid()) = id)
```

This policy prevents signup because `auth.uid()` is not available during the signup process.

## Step 4: Get Your Supabase Credentials
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy these two values:
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **Anon/Public Key** (starts with `eyJhbGciOiJIUzI1NiIs...`)

## Step 5: Create Your .env File
1. In your project root, create a file called `.env` (no extension)
2. Copy this content and replace with your actual values:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

## Step 6: Restart Your App
```bash
npm start
# or
yarn start
```

## Step 7: Test Signup
1. Try creating a new account
2. If it works, go to Supabase dashboard → Table Editor
3. Check the `profiles` table - you should see your data

## 🔧 Why This Error Happens

The "Database error saving new user" occurs because:

1. **Restrictive RLS Policy**: The policy `(select auth.uid()) = id` fails during signup
2. **Timing Issue**: `auth.uid()` is not available when the profile is being created
3. **Supabase Auth Flow**: Auth user is created first, then profile, but RLS blocks it

## 🛠️ Our Solution

1. **Permissive INSERT Policy**: Allow anyone to create profiles (needed for signup)
2. **Proper UPDATE/DELETE Policies**: Restrict to own profiles after signup
3. **No Foreign Key Constraints**: Avoid cascade issues
4. **Manual Relationship Management**: Handle user-profile relationship in app code

## Common Errors & Solutions

### "Database error saving new user"
**Solution:** Run the RLS policy fix migration `20250625003000_fix_rls_policy_final.sql`

### "Supabase not configured"
**Solution:** Create `.env` file with correct credentials

### "Connection failed"
**Solution:** Check your internet connection and Supabase project status

### "Username is already taken"
**Solution:** Try a different username

### "Invalid email or password"
**Solution:** Check email format and password length (min 6 characters)

## Demo Mode
If you haven't set up Supabase yet, the app works in demo mode:
- All features work locally
- Data stored in device memory only
- Perfect for testing and development
- No account creation or data persistence

## Verification Steps
1. ✅ RLS policy migration runs without errors
2. ✅ Correct policies are visible in Supabase dashboard
3. ✅ .env file created with correct values
4. ✅ App restarts successfully
5. ✅ Signup creates account without errors
6. ✅ Profile data appears in Supabase dashboard
7. ✅ Login works with created account

## Need Help?
- Check Supabase logs in dashboard
- Verify your URL and key are correct
- Ensure no extra spaces in .env file
- Try demo mode if database setup fails

That's it! Your app should now work perfectly with Supabase authentication.