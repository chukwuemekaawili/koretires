-- Add tire_recycling_levy column to orders table
-- Alberta charges $5 per tire as a recycling levy
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS tire_recycling_levy DECIMAL(10,2) DEFAULT 0;
