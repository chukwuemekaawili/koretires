-- Create review_requests table for tracking Google Review automation
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

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS review_requests_order_id_idx ON review_requests(order_id);
CREATE INDEX IF NOT EXISTS review_requests_status_idx ON review_requests(status);
CREATE INDEX IF NOT EXISTS review_requests_scheduled_date_idx ON review_requests(scheduled_date);

-- Enable RLS
ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage all review requests
CREATE POLICY "Admins can manage review requests"
ON review_requests
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Allow system to insert review requests (for order automation)
CREATE POLICY "System can insert review requests"
ON review_requests
FOR INSERT
TO authenticated
WITH CHECK (true);

COMMENT ON TABLE review_requests IS 'Tracks automated Google Review requests sent to customers after order completion';
COMMENT ON COLUMN review_requests.scheduled_date IS 'When the review request email should be sent (typically 7 days after order)';
COMMENT ON COLUMN review_requests.sent_at IS 'When the email was actually sent';
COMMENT ON COLUMN review_requests.clicked_at IS 'When the customer clicked the review link';
COMMENT ON COLUMN review_requests.status IS 'pending|sent|clicked|failed';
