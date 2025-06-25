# 🚀 Quick Supabase Setup Instructions

## ⚠️ CRITICAL: Fix "Could not find the 'has_completed_onboarding' column" Error

If you're getting the error "Could not find the 'has_completed_onboarding' column", follow these steps:

## Step 1: Run the Schema Cache Fix Migration
1. Go to your Supabase dashboard → SQL Editor
2. Click "New Query"
3. Copy the entire contents of `supabase/migrations/20250625010000_fix_schema_cache.sql`
4. Paste it and click "Run"
5. You should see "SUCCESS: Schema cache test passed - has_completed_onboarding column is accessible"

## Step 2: Get Your Supabase Credentials
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy these two values:
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **Anon/Public Key** (starts with `eyJhbGciOiJIUzI1NiIs...`)

## Step 3: Create Your .env File
1. In your project root, create a file called `.env` (no extension)
2. Copy this content and replace with your actual values:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

## Step 4: Restart Your App
```bash
npm start
# or
yarn start
```

## Step 5: Test Signup
1. Try creating a new account
2. If it works, go to Supabase dashboard → Table Editor
3. Check the `profiles` table - you should see your data

## 🔧 Why This Error Happens

The "Could not find the 'has_completed_onboarding' column" error occurs because:

1. **Schema Cache Issue**: Supabase's PostgREST cache doesn't recognize the column
2. **Table Structure Mismatch**: The column exists in the database but not in the cache
3. **Migration Order**: Previous migrations may have created the table without this column

## 🛠️ Our Solution

1. **Recreate Table**: Drop and recreate the profiles table with all required columns
2. **Force Cache Refresh**: Notify PostgREST to reload the schema
3. **Test Column Access**: Verify the column is accessible via SQL
4. **Restore Data**: Preserve any existing data during the migration

## Common Errors & Solutions

### "Could not find the 'has_completed_onboarding' column"
**Solution:** Run the schema cache fix migration `20250625010000_fix_schema_cache.sql`

### "Database error saving new user"
**Solution:** Run the RLS policy fix migration `20250625004000_final_auth_fix.sql`

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
1. ✅ Schema cache fix migration runs without errors
2. ✅ Test query returns "SUCCESS" message
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