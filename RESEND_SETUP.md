# Resend Email Automation - Quick Setup

## Step 1: Create Resend Account (2 minutes)

1. Go to: **https://resend.com/signup**
2. Sign up with your email
3. Verify your email address

## Step 2: Get API Key (1 minute)

1. Once logged in, go to **"API Keys"** in the left sidebar
2. Click **"Create API Key"**
3. Name it: `Kore Tires Reviews`
4. Click **"Add"**
5. **Copy the API key** (starts with `re_...`) - you'll need this next!

## Step 3: Add API Key to Supabase (2 minutes)

1. Open **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your **Koretires** project
3. Go to **Project Settings** (⚙️ icon bottom left) → **Edge Functions**
4. Scroll down to **"Secrets"** section
5. Click **"Add new secret"**
6. Enter:
   - **Name**: `RESEND_API_KEY`
   - **Value**: Paste the API key from Step 2
7. Click **"Save"**

## Step 4: Deploy the Edge Function

### Option A: Using Supabase CLI (Recommended)

In your terminal:

```powershell
# Install Supabase CLI globally
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project (you'll be prompted for project ref)
supabase link

# Deploy the function
supabase functions deploy send-review-emails
```

### Option B: Manual Deploy via Dashboard

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Click **"Create a new function"**
3. Name it: `send-review-emails`
4. Copy the contents of `supabase/functions/send-review-emails/index.ts`
5. Paste into the editor
6. Click **"Deploy"**

## Step 5: Set Up Daily Cron Job

1. In **Supabase Dashboard** → **Database** → **SQL Editor**
2. Click **"New query"**
3. Paste this SQL:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily email sending at 9 AM UTC (3 AM Edmonton)
SELECT cron.schedule(
  'send-review-emails-daily',
  '0 9 * * *', -- Every day at 9 AM UTC
  $$
  SELECT net.http_post(
    url := 'YOUR_FUNCTION_URL',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_ANON_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

4. **Replace**:
   - `YOUR_FUNCTION_URL` with: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-review-emails`
   - `YOUR_ANON_KEY` with your project's anon key (from Project Settings → API)

5. Click **"Run"**

## Step 6: Test It!

### Manual Test (before waiting for cron):

```powershell
# Test the function directly
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-review-emails `
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Full Test:

1. Place a test order on `localhost:8082`
2. Use your own email address
3. Check Supabase: `SELECT * FROM review_requests;`
4. Manually change `scheduled_date` to NOW:
   ```sql
   UPDATE review_requests 
   SET scheduled_date = NOW() 
   WHERE customer_email = 'your@email.com';
   ```
5. Run the curl command above
6. **Check your email inbox!**

## What Happens Now:

✅ Every day at 9 AM UTC:
- System checks for pending review requests
- Sends emails to customers whose `scheduled_date` has passed
- Marks them as `sent` in database
- Logs results in function logs

## Troubleshooting

**"RESEND_API_KEY not found"**
- Make sure you added the secret in Supabase Edge Functions settings
- Redeploy the function after adding secrets

**"Function not found"**
- Check function is deployed: `supabase functions list`
- Verify function name matches: `send-review-emails`

**"No emails sent"**
- Check Supabase logs: Edge Functions → send-review-emails → Logs
- Verify there are pending requests: `SELECT * FROM review_requests WHERE status='pending';`

## Next Steps

1. **Domain Verification** (Optional): Verify `koretires.com` in Resend to send from `noreply@koretires.com` instead of `@resend.dev`
2. **Monitor Performance**: Check Resend dashboard for delivery rates
3. **Track Reviews**: See which customers click the review link

---

✅ **Setup Complete!** Your automated Google Review system is now live!
