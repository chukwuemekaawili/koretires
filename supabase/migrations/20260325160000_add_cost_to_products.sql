-- Add cost and sales_price columns to products for inventory accounting
-- cost = what we pay for the product (purchase price)
-- sales_price = what we sell it for (defaults to existing price column)

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cost numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sales_price numeric(10,2);

-- Set sales_price to existing price for all current products
UPDATE products SET sales_price = price WHERE sales_price IS NULL;

-- Add comment for clarity
COMMENT ON COLUMN products.cost IS 'Purchase cost per unit for inventory valuation';
COMMENT ON COLUMN products.sales_price IS 'Retail/sales price per unit (defaults to price column value)';
