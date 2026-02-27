-- Add new columns for Invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS guest_phone TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS ab_levy NUMERIC(10, 2) DEFAULT 0.00;

-- Add dealer pricing to Products
ALTER TABLE products ADD COLUMN IF NOT EXISTS dealer_price NUMERIC(10, 2);

-- Update existing products to have a dealer_price equal to their regular price as a fallback
UPDATE products SET dealer_price = price WHERE dealer_price IS NULL;

-- Fix RLS policy for newsletter_subscribers to allow public insertions (useful for footer signup)
-- First check if a policy already exists and drop it to recreate it, or just use IF NOT EXISTS if possible.
-- It's safer to just drop and recreate or create IF NOT EXISTS in pg 13+ is not fully supported for policies, 
-- we will just make sure it exists.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'newsletter_subscribers' 
        AND policyname = 'Enable insert for anon users'
    ) THEN
        CREATE POLICY "Enable insert for anon users" ON newsletter_subscribers FOR INSERT TO public WITH CHECK (true);
    END IF;
END
$$;
