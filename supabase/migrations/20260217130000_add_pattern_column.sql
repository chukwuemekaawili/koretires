-- Add pattern column to products table
-- Tire pattern/tread pattern name (e.g., SP9, AT5, etc.)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS pattern TEXT;
