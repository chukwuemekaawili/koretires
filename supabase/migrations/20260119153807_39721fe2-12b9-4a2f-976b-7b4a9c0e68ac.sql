-- =====================================================
-- KORE TIRES FULL SCHEMA EXPANSION
-- =====================================================

-- 1. Site Settings (GST config, shipping, etc.)
CREATE TABLE public.site_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text UNIQUE NOT NULL,
    value jsonb NOT NULL DEFAULT '{}',
    description text,
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view settings" ON public.site_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings" ON public.site_settings
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.site_settings (key, value, description) VALUES
('gst', '{"rate": 5, "display_mode": "before_tax", "enabled": true}', 'GST configuration'),
('shipping', '{"free_delivery_zones": ["Edmonton"], "request_mode": true}', 'Shipping configuration'),
('dealer_checkout', '{"mode": "quote_request", "direct_order_enabled": false}', 'Dealer checkout mode'),
('services', '{"booking_mode": "date_only", "time_slots_enabled": false}', 'Service booking configuration');

-- 2. Checkout Add-ons
CREATE TABLE public.checkout_addons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    price numeric NOT NULL DEFAULT 0,
    is_taxable boolean DEFAULT true,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    category text DEFAULT 'general',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.checkout_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active addons" ON public.checkout_addons
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage addons" ON public.checkout_addons
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Insert default add-ons
INSERT INTO public.checkout_addons (name, description, price, is_taxable, sort_order, category) VALUES
('Tire Disposal Fee', 'Environmentally responsible tire disposal', 5.00, true, 1, 'required'),
('Nitrogen Fill', 'Premium nitrogen tire inflation for longer tire life', 12.00, true, 2, 'service'),
('Wheel Balancing', 'Professional wheel balancing per tire', 15.00, true, 3, 'service'),
('TPMS Sensor Reset', 'Tire pressure monitoring system reset', 25.00, true, 4, 'service'),
('Valve Stems', 'New rubber valve stems (set of 4)', 20.00, true, 5, 'parts'),
('Road Hazard Protection', '2-year road hazard warranty', 49.00, false, 6, 'warranty');

-- 3. Order Add-ons (line items for add-ons on orders)
CREATE TABLE public.order_addons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    addon_id uuid REFERENCES public.checkout_addons(id),
    name text NOT NULL,
    price numeric NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    is_taxable boolean DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order addons" ON public.order_addons
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM orders WHERE orders.id = order_addons.order_id AND orders.user_id = auth.uid())
    );

CREATE POLICY "Anyone can create order addons" ON public.order_addons
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage order addons" ON public.order_addons
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 4. Mobile Tire Swap Bookings
CREATE TABLE public.mobile_swap_bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    address text NOT NULL,
    city text DEFAULT 'Edmonton',
    postal_code text,
    preferred_date date NOT NULL,
    preferred_time_window text,
    vehicle_year text,
    vehicle_make text,
    vehicle_model text,
    tire_size text,
    num_tires integer DEFAULT 4,
    service_type text DEFAULT 'swap',
    notes text,
    photo_urls text[],
    status text DEFAULT 'new',
    internal_notes text,
    contact_log jsonb DEFAULT '[]',
    quoted_price numeric,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mobile_swap_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create bookings" ON public.mobile_swap_bookings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own bookings" ON public.mobile_swap_bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage bookings" ON public.mobile_swap_bookings
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 5. Subscription Plans
CREATE TABLE public.subscription_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    tier text NOT NULL,
    price_monthly numeric,
    price_annually numeric,
    description text,
    features jsonb DEFAULT '[]',
    is_active boolean DEFAULT true,
    for_fleet boolean DEFAULT false,
    max_vehicles integer,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans" ON public.subscription_plans
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage plans" ON public.subscription_plans
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Insert default plans
INSERT INTO public.subscription_plans (name, tier, price_monthly, price_annually, description, features, for_fleet, max_vehicles) VALUES
('Essential', 'basic', 19.99, 199.00, 'Basic tire maintenance coverage', '["Seasonal tire swap (2x/year)", "Free tire rotations", "10% off tire purchases", "Priority booking"]', false, 1),
('Premium', 'premium', 39.99, 399.00, 'Complete tire care package', '["Seasonal tire swap (2x/year)", "Free tire rotations", "15% off tire purchases", "Free tire storage", "Road hazard protection", "Priority booking", "Free flat repairs"]', false, 2),
('Fleet Basic', 'fleet_basic', 149.99, 1499.00, 'Small fleet coverage', '["Seasonal swaps for all vehicles", "Fleet-wide rotations", "20% off tire purchases", "Dedicated account manager", "Monthly reporting"]', true, 10),
('Fleet Enterprise', 'fleet_enterprise', NULL, NULL, 'Custom enterprise solution', '["Unlimited vehicles", "Custom pricing", "24/7 support", "On-site service options", "Full fleet management"]', true, NULL);

-- 6. Subscriptions
CREATE TABLE public.subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
    status text DEFAULT 'pending',
    start_date date,
    next_renewal_date date,
    billing_interval text DEFAULT 'monthly',
    vehicles jsonb DEFAULT '[]',
    contact_name text NOT NULL,
    contact_email text NOT NULL,
    contact_phone text NOT NULL,
    company_name text,
    service_preferences jsonb DEFAULT '{}',
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create subscriptions" ON public.subscriptions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 7. AI Conversations
CREATE TABLE public.ai_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    session_id text NOT NULL,
    channel text NOT NULL DEFAULT 'web',
    messages jsonb DEFAULT '[]',
    summary text,
    intent text,
    recommended_product_ids uuid[],
    lead_captured boolean DEFAULT false,
    lead_data jsonb,
    status text DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON public.ai_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create conversations" ON public.ai_conversations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update conversations by session" ON public.ai_conversations
    FOR UPDATE USING (true);

CREATE POLICY "Admins can manage conversations" ON public.ai_conversations
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 8. Newsletter Subscribers
CREATE TABLE public.newsletter_subscribers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    name text,
    source text DEFAULT 'website',
    is_active boolean DEFAULT true,
    preferences jsonb DEFAULT '{"promotions": true, "tips": true}',
    created_at timestamptz NOT NULL DEFAULT now(),
    unsubscribed_at timestamptz
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage subscribers" ON public.newsletter_subscribers
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 9. Review Requests
CREATE TABLE public.review_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.orders(id),
    customer_id uuid REFERENCES public.customers(id),
    email text NOT NULL,
    phone text,
    status text DEFAULT 'pending',
    sent_at timestamptz,
    clicked_at timestamptz,
    review_url text,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage review requests" ON public.review_requests
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 10. Invoices
CREATE TABLE public.invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number text UNIQUE NOT NULL,
    order_id uuid REFERENCES public.orders(id),
    customer_id uuid REFERENCES public.customers(id),
    dealer_id uuid REFERENCES public.dealers(id),
    type text DEFAULT 'retail',
    status text DEFAULT 'draft',
    subtotal numeric NOT NULL,
    gst numeric NOT NULL DEFAULT 0,
    total numeric NOT NULL,
    line_items jsonb NOT NULL DEFAULT '[]',
    notes text,
    due_date date,
    paid_at timestamptz,
    pdf_url text,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers can view own invoices" ON public.invoices
    FOR SELECT USING (
        dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage invoices" ON public.invoices
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Invoice number generation trigger
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.invoice_number = 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_invoice_number
    BEFORE INSERT ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_invoice_number();

-- 11. Audit Log
CREATE TABLE public.audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    action text NOT NULL,
    table_name text NOT NULL,
    record_id uuid,
    old_values jsonb,
    new_values jsonb,
    ip_address text,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log" ON public.audit_log
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit log" ON public.audit_log
    FOR INSERT WITH CHECK (true);

-- 12. Dealer Quote Requests
CREATE TABLE public.dealer_quotes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dealer_id uuid NOT NULL REFERENCES public.dealers(id),
    status text DEFAULT 'pending',
    items jsonb NOT NULL DEFAULT '[]',
    notes text,
    admin_notes text,
    quoted_total numeric,
    valid_until date,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dealer_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers can view own quotes" ON public.dealer_quotes
    FOR SELECT USING (
        dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid())
    );

CREATE POLICY "Dealers can create quotes" ON public.dealer_quotes
    FOR INSERT WITH CHECK (
        dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage quotes" ON public.dealer_quotes
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 13. Product Categories
CREATE TABLE public.product_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    parent_id uuid REFERENCES public.product_categories(id),
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories" ON public.product_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON public.product_categories
    FOR ALL USING (has_role(auth.uid(), 'admin'));

INSERT INTO public.product_categories (name, slug, sort_order) VALUES
('All Season Tires', 'all-season', 1),
('Winter Tires', 'winter', 2),
('All Weather Tires', 'all-weather', 3),
('Summer Tires', 'summer', 4),
('Accessories', 'accessories', 5),
('Services', 'services', 6);

-- 14. Add category_id to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.product_categories(id);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS quantity integer;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS low_stock_threshold integer DEFAULT 10;

-- Update triggers for new tables
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_checkout_addons_updated_at BEFORE UPDATE ON public.checkout_addons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mobile_swap_bookings_updated_at BEFORE UPDATE ON public.mobile_swap_bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dealer_quotes_updated_at BEFORE UPDATE ON public.dealer_quotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 15. Storage bucket for uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can upload files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Anyone can view uploaded files" ON storage.objects
    FOR SELECT USING (bucket_id = 'uploads');

CREATE POLICY "Admins can delete files" ON storage.objects
    FOR DELETE USING (bucket_id = 'uploads' AND has_role(auth.uid(), 'admin'));