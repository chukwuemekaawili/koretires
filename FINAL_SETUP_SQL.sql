-- ==============================================================================
-- 1. Create the review_requests table
-- ==============================================================================
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

-- Indexes
CREATE INDEX IF NOT EXISTS review_requests_order_id_idx ON review_requests(order_id);
CREATE INDEX IF NOT EXISTS review_requests_status_idx ON review_requests(status);
CREATE INDEX IF NOT EXISTS review_requests_scheduled_date_idx ON review_requests(scheduled_date);

-- RLS Policies
ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;

-- Safely create policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Admins can manage review requests" ON review_requests;
    DROP POLICY IF EXISTS "System can insert review requests" ON review_requests;
END
$$;

-- FIXED POLICY: Uses has_role() instead of profiles table
CREATE POLICY "Admins can manage review requests"
ON review_requests FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert review requests"
ON review_requests FOR INSERT TO authenticated
WITH CHECK (true);

-- ==============================================================================
-- 2. Setup Daily Cron Job
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the job for 9 AM UTC daily
SELECT cron.schedule(
  'send-review-emails-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://cfxmrckrzfocmdtnstwx.supabase.co/functions/v1/send-review-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmeG1yY2tyemZvY21kdG5zdHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NzQ0NjUsImV4cCI6MjA4NDM1MDQ2NX0.leiLW46GoL1cH6EoazfMzH844XqoRzziKp3GMlv9ELE'
    ),
    body := '{}'::jsonb
  );
  $$
);
