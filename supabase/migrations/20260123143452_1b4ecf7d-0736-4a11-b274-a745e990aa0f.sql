-- Fix the view to NOT be security definer - it should use invoker permissions
-- This is safer and the linter warning is for views that might accidentally expose data

DROP VIEW IF EXISTS products_public;

CREATE VIEW products_public 
WITH (security_invoker = true) 
AS
SELECT 
  id,
  size,
  description,
  vendor,
  type,
  price,
  -- wholesale_price intentionally EXCLUDED
  availability,
  image_url,
  features,
  sku,
  is_active,
  category_id,
  quantity,
  low_stock_threshold,
  created_at,
  updated_at
FROM products
WHERE is_active = true;

-- Re-grant SELECT on the view
GRANT SELECT ON products_public TO anon;
GRANT SELECT ON products_public TO authenticated;