# Quick Supabase Setup Instructions

## Step 1: Get Your Supabase Credentials
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy these two values:
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **Anon/Public Key** (starts with `eyJhbGciOiJIUzI1NiIs...`)

## Step 2: Create Your .env File
1. In your project root, create a file called `.env` (no extension)
2. Copy this content and replace with your actual values:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

## Step 3: Create Database Tables
1. In your Supabase dashboard, go to SQL Editor
2. Click "New Query"
3. Copy the entire contents of `lib/supabase-setup.sql` and paste it
4. Click "Run" to create all tables

## Step 4: Restart Your App
```bash
npm start
# or
yarn start
```

## Step 5: Test the Connection
1. Complete the onboarding flow in your app
2. Go to your Supabase dashboard → Table Editor
3. Check the `profiles` table - you should see your data
4. Try adding friends, completing bingo tasks, etc.
5. Verify data appears in the respective tables

## Demo Mode
If you haven't set up Supabase yet, the app will work in demo mode:
- All features work locally
- Data is stored in device memory only
- Perfect for testing and development
- No account creation or data persistence

## Troubleshooting
- Make sure `.env` is in your project root (same level as `package.json`)
- Restart your development server after creating `.env`
- Check Supabase logs if you get errors
- Verify your URL and key are correct (no extra spaces)
- If you see "Database error saving new user", check your Supabase configuration

## Error: "Database error saving new user"
This error means:
1. Your `.env` file is missing or has incorrect values
2. Your Supabase project is not accessible
3. The database tables haven't been created yet

**Quick Fix:**
1. Double-check your `.env` file
2. Run the SQL setup script in Supabase
3. Restart your app
4. Or use Demo Mode to test the app without a database

That's it! Your app will automatically sync all data to Supabase when configured.