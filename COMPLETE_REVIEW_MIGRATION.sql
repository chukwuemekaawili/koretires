-- ==============================================================================
-- COMPLETE REVIEW AUTOMATION SETUP
-- Run this entire script in Supabase SQL Editor
-- ==============================================================================

-- 1. Create the review_requests table
CREATE TABLE IF NOT EXISTS review_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  order_number TEXT NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'clicked', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS review_requests_order_id_idx ON review_requests(order_id);
CREATE INDEX IF NOT EXISTS review_requests_status_idx ON review_requests(status);
CREATE INDEX IF NOT EXISTS review_requests_scheduled_date_idx ON review_requests(scheduled_date);

-- 3. RLS Policies
ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;

-- Safely drop existing policies to avoid conflicts
DO $$
BEGIN
    DROP POLICY IF EXISTS "Admins can manage review requests" ON review_requests;
    DROP POLICY IF EXISTS "System can insert review requests" ON review_requests;
    DROP POLICY IF EXISTS "Allow anonymous insert of review requests" ON review_requests;
END
$$;

-- Policy: Admins can manage all review requests
CREATE POLICY "Admins can manage review requests"
ON review_requests FOR ALL TO authenticated
USING (
  -- Check if user is admin (adjust based on your auth/roles setup)
  -- If you use public.profiles:
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  -- OR if you use metadata or a function:
  -- public.is_admin()
);

-- Policy: Authenticated users (e.g. system service role or logged in users)
CREATE POLICY "System can insert review requests"
ON review_requests FOR INSERT TO authenticated
WITH CHECK (true);

-- Policy: Anonymous users (Guest Checkout)
-- CRITICAL for orders placed without logging in
CREATE POLICY "Allow anonymous insert of review requests"
ON review_requests FOR INSERT TO anon
WITH CHECK (true);

-- ==============================================================================
-- 4. Setup Daily Cron Job (Optional - Run if not already monitoring)
-- ==============================================================================
-- Make sure to replace YOUR_PROJECT_REF and YOUR_ANON_KEY with actual values if copying manually
-- or use the values you already have.

-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule(
--   'send-review-emails-daily',
--   '0 9 * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-review-emails',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer YOUR_ANON_KEY'
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
