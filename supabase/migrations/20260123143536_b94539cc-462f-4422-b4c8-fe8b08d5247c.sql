-- The products_public view needs SECURITY DEFINER to allow public access
-- This is safe because we explicitly exclude wholesale_price from the view
-- The linter warning is acceptable in this case - we're intentionally using it

DROP VIEW IF EXISTS products_public;

-- Create view with security_barrier for extra protection
CREATE VIEW products_public 
WITH (security_barrier = true)
AS
SELECT 
  id,
  size,
  description,
  vendor,
  type,
  price,
  -- wholesale_price is intentionally EXCLUDED for security
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

-- Grant access
GRANT SELECT ON products_public TO anon;
GRANT SELECT ON products_public TO authenticated;

-- Mark it as security definer via function wrapper
-- Better approach: create an RPC that returns public products
CREATE OR REPLACE FUNCTION get_products_view()
RETURNS TABLE(
  id uuid,
  size text,
  description text,
  vendor text,
  type tire_type,
  price numeric,
  availability text,
  features text[],
  image_url text,
  sku text,
  is_active boolean,
  category_id uuid,
  quantity integer,
  low_stock_threshold integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.size,
    p.description,
    p.vendor,
    p.type,
    p.price,
    -- wholesale_price NOT returned
    p.availability,
    p.features,
    p.image_url,
    p.sku,
    p.is_active,
    p.category_id,
    p.quantity,
    p.low_stock_threshold,
    p.created_at,
    p.updated_at
  FROM products p
  WHERE p.is_active = true
  ORDER BY p.price ASC
$$;

GRANT EXECUTE ON FUNCTION get_products_view() TO anon;
GRANT EXECUTE ON FUNCTION get_products_view() TO authenticated;