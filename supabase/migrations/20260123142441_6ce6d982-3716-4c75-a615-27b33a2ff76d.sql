-- Security Function: Check if user is an approved dealer
-- This function is already created, but we'll make sure it exists
CREATE OR REPLACE FUNCTION public.is_approved_dealer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.dealers
    WHERE user_id = _user_id
      AND status = 'approved'
  )
$$;

-- RPC Function: Get products with wholesale_price only for approved dealers
-- This is the defense-in-depth solution
CREATE OR REPLACE FUNCTION public.get_products_public(
  p_product_id uuid DEFAULT NULL
)
RETURNS TABLE (
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
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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
      WHEN caller_is_approved THEN p.wholesale_price
      ELSE NULL
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

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.get_products_public(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_products_public(uuid) TO anon;