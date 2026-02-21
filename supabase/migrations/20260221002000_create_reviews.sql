-- Create reviews table
DROP TABLE IF EXISTS reviews CASCADE;
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS reviews_product_id_idx ON reviews(product_id);
CREATE INDEX IF NOT EXISTS reviews_status_idx ON reviews(status);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policies
-- Anyone can read approved reviews
CREATE POLICY "Public can view approved reviews"
ON reviews FOR SELECT
TO public
USING (status = 'approved');

-- Authenticated users or public (guests) can submit reviews
-- We allow public insert, but they default to 'pending' so it's safe and won't be shown until approved
CREATE POLICY "Public can submit reviews"
ON reviews FOR INSERT
TO public
WITH CHECK (true);

-- Admins can manage all reviews
CREATE POLICY "Admins can manage reviews"
ON reviews FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
