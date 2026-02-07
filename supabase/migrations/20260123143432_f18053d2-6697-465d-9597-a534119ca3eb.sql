-- SECURITY LOCKDOWN: Wholesale Price Protection
-- Strategy: Remove wholesale_price from public product queries entirely
-- Only admins and approved dealers can access wholesale pricing

-- Step 1: Drop existing permissive SELECT policies on products
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Public can view active products" ON products;

-- Step 2: Create a products_public VIEW that EXCLUDES wholesale_price
-- This view will be used by all public/retail queries
CREATE OR REPLACE VIEW products_public AS
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

-- Step 3: Grant SELECT on the view to anon and authenticated
GRANT SELECT ON products_public TO anon;
GRANT SELECT ON products_public TO authenticated;

-- Step 4: Create new RLS policy - base table SELECT only for admin/staff  
-- This prevents direct SELECT on products table for non-admins
CREATE POLICY "Only admin/staff can SELECT from products base table"
ON products FOR SELECT
TO authenticated
USING (is_admin_or_staff(auth.uid()));

-- Step 5: Also allow anon to NOT directly select from products (they use the view)
-- No policy = no access for anon on base table (RLS enabled)

-- Step 6: Update get_products_public RPC to be the ONLY way to get wholesale pricing for dealers
-- This RPC already conditionally returns wholesale_price only for approved dealers
-- Drop and recreate with explicit security
DROP FUNCTION IF EXISTS get_products_public(uuid);

CREATE OR REPLACE FUNCTION get_products_public(p_product_id uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  size text,
  description text,
  vendor text,
  type tire_type,
  price numeric,
  wholesale_price numeric,
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
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_approved boolean;
BEGIN
  -- Check if the caller is an approved dealer
  caller_is_approved := COALESCE(is_approved_dealer(auth.uid()), false);
  
  RETURN QUERY
  SELECT 
    p.id,
    p.size,
    p.description,
    p.vendor,
    p.type,
    p.price,
    CASE 
      WHEN caller_is_approved OR is_admin_or_staff(auth.uid()) THEN p.wholesale_price
      ELSE NULL::numeric
    END as wholesale_price,
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
    AND (p_product_id IS NULL OR p.id = p_product_id)
  ORDER BY p.price ASC;
END;
$$;

-- Grant execute on the RPC
GRANT EXECUTE ON FUNCTION get_products_public(uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_products_public(uuid) TO authenticated;

-- Step 7: Create a separate function for admin product management that returns all fields
CREATE OR REPLACE FUNCTION get_products_admin()
RETURNS TABLE(
  id uuid,
  size text,
  description text,
  vendor text,
  type tire_type,
  price numeric,
  wholesale_price numeric,
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
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admin/staff
  IF NOT is_admin_or_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin or staff role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.size,
    p.description,
    p.vendor,
    p.type,
    p.price,
    p.wholesale_price,
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
  ORDER BY p.created_at DESC;
END;
$$;

-- Only authenticated users can call this (and it self-validates admin role)
GRANT EXECUTE ON FUNCTION get_products_admin() TO authenticated;