# Supabase Setup Guide

## Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login to your account
3. Click "New Project"
4. Choose your organization
5. Fill in project details:
   - Name: `bar-buddy-app` (or whatever you prefer)
   - Database Password: Create a strong password
   - Region: Choose closest to your users
6. Click "Create new project"
7. Wait for project to be created (takes ~2 minutes)

## Step 2: Get Your Project Credentials
1. In your Supabase dashboard, go to Settings → API
2. Copy your:
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **Anon/Public Key** (starts with `eyJhbGciOiJIUzI1NiIs...`)

## Step 3: Set Up Environment Variables
1. Create a `.env` file in your project root
2. Copy the contents from `.env.example`
3. Replace the placeholder values with your actual Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
   ```

## Step 4: Create Database Tables
1. In your Supabase dashboard, go to the SQL Editor
2. Click "New Query"
3. Copy and paste the entire contents of `lib/supabase-setup.sql`
4. Click "Run" to execute the SQL
5. You should see tables created in the Table Editor

## Step 5: Test the Connection
1. Restart your app: `npm start` or `yarn start`
2. Complete the onboarding flow in your app
3. Go to your Supabase dashboard → Table Editor
4. Check the `user_profiles` table - you should see your profile data
5. Try adding friends, completing bingo tasks, etc.
6. Verify data appears in the respective tables

## Step 6: Monitor Your Data
You can view all your app data in the Supabase dashboard:
- **Table Editor**: View/edit data directly
- **Authentication**: Manage users (if you add auth later)
- **API**: Test your API endpoints
- **Logs**: Monitor database activity

## Troubleshooting
- If you get connection errors, double-check your environment variables
- Make sure your `.env` file is in the project root
- Restart your development server after changing environment variables
- Check the Supabase logs for any database errors

## Security Notes
- Never commit your `.env` file to version control
- The anon key is safe to use in client-side code
- For production, consider implementing Row Level Security policies