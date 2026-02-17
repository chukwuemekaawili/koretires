-- Fix RLS for guest checkout: allow anon inserts to customers and orders
-- This ensures guest users can place orders without authentication errors

-- 1. Customers Table
DROP POLICY IF EXISTS "Anyone can create customers" ON public.customers;
CREATE POLICY "Anyone can create customers"
ON public.customers FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 2. Orders Table
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders"
ON public.orders FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 3. Order Items Table
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Anyone can create order items"
ON public.order_items FOR INSERT
TO anon, authenticated
WITH CHECK (true);
