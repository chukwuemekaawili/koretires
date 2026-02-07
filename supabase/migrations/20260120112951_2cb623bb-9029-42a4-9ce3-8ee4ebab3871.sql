-- ============================================
-- RLS SECURITY PASS - Tightened Policies
-- ============================================

-- Drop any overly permissive policies and recreate with proper constraints

-- ===== PAGES & PAGE_SECTIONS =====
-- Public can read active pages/sections; only admin/staff can modify

DROP POLICY IF EXISTS "Anyone can read active pages" ON public.pages;
DROP POLICY IF EXISTS "Admins can manage pages" ON public.pages;

CREATE POLICY "Public can read active pages"
ON public.pages FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins can manage pages"
ON public.pages FOR ALL
TO authenticated
USING (public.is_admin_or_staff(auth.uid()))
WITH CHECK (public.is_admin_or_staff(auth.uid()));

DROP POLICY IF EXISTS "Anyone can read active sections" ON public.page_sections;
DROP POLICY IF EXISTS "Admins can manage sections" ON public.page_sections;

CREATE POLICY "Public can read active sections"
ON public.page_sections FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins can manage sections"
ON public.page_sections FOR ALL
TO authenticated
USING (public.is_admin_or_staff(auth.uid()))
WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- ===== SITE_SETTINGS =====
-- Public can read public-safe keys; admins can manage all

DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;

CREATE POLICY "Public can read public settings"
ON public.site_settings FOR SELECT
TO public
USING (key IN ('gst_rate', 'public_messaging', 'payment_messaging', 'store_hours', 'contact_phone', 'contact_email'));

CREATE POLICY "Admins can manage site settings"
ON public.site_settings FOR ALL
TO authenticated
USING (public.is_admin_or_staff(auth.uid()))
WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- ===== PRODUCTS =====
-- Public can read active products; only admin/staff can modify (especially pricing)

DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

CREATE POLICY "Public can view active products"
ON public.products FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins can manage products"
ON public.products FOR ALL
TO authenticated
USING (public.is_admin_or_staff(auth.uid()))
WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- ===== INVENTORY =====
-- Public cannot read inventory details; only admin/staff can manage

DROP POLICY IF EXISTS "Admins can manage inventory" ON public.inventory;

CREATE POLICY "Admins can manage inventory"
ON public.inventory FOR ALL
TO authenticated
USING (public.is_admin_or_staff(auth.uid()))
WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- ===== INVENTORY_MOVEMENTS =====
-- Only admin/staff can read and manage

DROP POLICY IF EXISTS "Admins can manage movements" ON public.inventory_movements;

CREATE POLICY "Admins can manage movements"
ON public.inventory_movements FOR ALL
TO authenticated
USING (public.is_admin_or_staff(auth.uid()))
WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- ===== INVOICES =====
-- Only admin/staff can manage; customers can view own invoices

DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;
DROP POLICY IF EXISTS "Customers can view own invoices" ON public.invoices;

CREATE POLICY "Admins can manage invoices"
ON public.invoices FOR ALL
TO authenticated
USING (public.is_admin_or_staff(auth.uid()))
WITH CHECK (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Customers view own invoices"
ON public.invoices FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM public.customers WHERE user_id = auth.uid()
  )
);

-- ===== AUDIT_LOG =====
-- Only admin/staff can read; writes happen via SECURITY DEFINER trigger

DROP POLICY IF EXISTS "Admins can read audit log" ON public.audit_log;

CREATE POLICY "Admins can read audit log"
ON public.audit_log FOR SELECT
TO authenticated
USING (public.is_admin_or_staff(auth.uid()));

-- ===== COMPANY_INFO =====
-- Public can read all; only admin/staff can modify

DROP POLICY IF EXISTS "Anyone can read company info" ON public.company_info;
DROP POLICY IF EXISTS "Admins can manage company info" ON public.company_info;

CREATE POLICY "Public can read company info"
ON public.company_info FOR SELECT
TO public
USING (true);

CREATE POLICY "Admins can manage company info"
ON public.company_info FOR ALL
TO authenticated
USING (public.is_admin_or_staff(auth.uid()))
WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- ===== FAQ_ENTRIES =====
-- Public can read active; admin manages

DROP POLICY IF EXISTS "Anyone can read active FAQs" ON public.faq_entries;
DROP POLICY IF EXISTS "Admins can manage FAQs" ON public.faq_entries;

CREATE POLICY "Public can read active FAQs"
ON public.faq_entries FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins can manage FAQs"
ON public.faq_entries FOR ALL
TO authenticated
USING (public.is_admin_or_staff(auth.uid()))
WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- ===== SERVICE_CATALOG =====
-- Public can read active; admin manages

DROP POLICY IF EXISTS "Anyone can read active services" ON public.service_catalog;
DROP POLICY IF EXISTS "Admins can manage services" ON public.service_catalog;

CREATE POLICY "Public can read active services"
ON public.service_catalog FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins can manage services"
ON public.service_catalog FOR ALL
TO authenticated
USING (public.is_admin_or_staff(auth.uid()))
WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- ===== POLICIES (legal) =====
-- Public can read active; admin manages

DROP POLICY IF EXISTS "Anyone can read active policies" ON public.policies;
DROP POLICY IF EXISTS "Admins can manage policies" ON public.policies;

CREATE POLICY "Public can read active policies"
ON public.policies FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins can manage policies"
ON public.policies FOR ALL
TO authenticated
USING (public.is_admin_or_staff(auth.uid()))
WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- ===== PRODUCT_CATEGORIES =====
-- Public can read active; admin manages

DROP POLICY IF EXISTS "Anyone can read categories" ON public.product_categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.product_categories;

CREATE POLICY "Public can read active categories"
ON public.product_categories FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins can manage categories"
ON public.product_categories FOR ALL
TO authenticated
USING (public.is_admin_or_staff(auth.uid()))
WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- ===== CHECKOUT_ADDONS =====
-- Public can read active; admin manages

DROP POLICY IF EXISTS "Anyone can read active addons" ON public.checkout_addons;
DROP POLICY IF EXISTS "Admins can manage addons" ON public.checkout_addons;

CREATE POLICY "Public can read active addons"
ON public.checkout_addons FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins can manage addons"
ON public.checkout_addons FOR ALL
TO authenticated
USING (public.is_admin_or_staff(auth.uid()))
WITH CHECK (public.is_admin_or_staff(auth.uid()));