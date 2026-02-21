-- Create referral_codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  referrer_name TEXT NOT NULL,
  referrer_email TEXT,
  reward_amount NUMERIC NOT NULL DEFAULT 50.00,
  discount_amount NUMERIC NOT NULL DEFAULT 50.00,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referral_redemptions table
CREATE TABLE IF NOT EXISTS referral_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID REFERENCES referral_codes(id) ON DELETE RESTRICT,
  referred_email TEXT NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  reward_status TEXT DEFAULT 'pending' CHECK (reward_status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_redemptions_code_id ON referral_redemptions(code_id);
CREATE INDEX IF NOT EXISTS idx_referral_redemptions_order_id ON referral_redemptions(order_id);

-- Enable RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_redemptions ENABLE ROW LEVEL SECURITY;

-- Policies for referral_codes
-- Public can select active codes (needed for checkout validation)
CREATE POLICY "Public can view active referral codes"
ON referral_codes FOR SELECT
TO public
USING (status = 'active');

-- Admins can manage referral_codes
CREATE POLICY "Admins can manage referral_codes"
ON referral_codes FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policies for referral_redemptions
-- Public can insert redemptions (during checkout)
CREATE POLICY "Public can insert referral_redemptions"
ON referral_redemptions FOR INSERT
TO public
WITH CHECK (true);

-- Admins can manage referral_redemptions
CREATE POLICY "Admins can manage referral_redemptions"
ON referral_redemptions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
