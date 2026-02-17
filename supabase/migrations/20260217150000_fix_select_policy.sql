-- Fix RLS: Allow anonymous users to SELECT the records they just created
-- This is required because the Supabase client performs an INSERT ... SELECT operation

-- 1. Customers Table
CREATE POLICY "Anyone can read customers with guest_id"
ON public.customers FOR SELECT
TO anon
USING (guest_id IS NOT NULL);

-- 2. Orders Table
-- There is already a "Guests can view orders by guest_id" policy in the original migration
-- validating if it covers anon role properly.
-- Just to be safe and explicit:
DROP POLICY IF EXISTS "Guests can view orders by guest_id" ON public.orders;

CREATE POLICY "Guests can view orders by guest_id"
ON public.orders FOR SELECT
TO anon, authenticated
USING (guest_id IS NOT NULL);

-- 3. Order Items Table
-- Inherits access from orders usually, but let's be explicit for the RETURNING clause
DROP POLICY IF EXISTS "Guests can view order items by guest_id" ON public.order_items;

CREATE POLICY "Guests can view order items by guest_id"
ON public.order_items FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
      AND orders.guest_id IS NOT NULL
  )
);
