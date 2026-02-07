-- ============================================
-- PRODUCTION SCHEMA: FAQ, Services, Policies, AI Leads, Notifications
-- ============================================

-- 1) FAQ Entries for AI grounding
CREATE TABLE IF NOT EXISTS public.faq_entries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.faq_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "FAQ entries are publicly readable when active" ON public.faq_entries;
CREATE POLICY "FAQ entries are publicly readable when active"
    ON public.faq_entries FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Admin can manage FAQ entries" ON public.faq_entries;
CREATE POLICY "Admin can manage FAQ entries"
    ON public.faq_entries FOR ALL
    USING (public.is_admin_or_staff(auth.uid()));

-- 2) Service Catalog for AI grounding
CREATE TABLE IF NOT EXISTS public.service_catalog (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price_note TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service catalog is publicly readable when active" ON public.service_catalog;
CREATE POLICY "Service catalog is publicly readable when active"
    ON public.service_catalog FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Admin can manage service catalog" ON public.service_catalog;
CREATE POLICY "Admin can manage service catalog"
    ON public.service_catalog FOR ALL
    USING (public.is_admin_or_staff(auth.uid()));

-- 3) Policies table (editable legal/business policies)
CREATE TABLE IF NOT EXISTS public.policies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Policies are publicly readable when active" ON public.policies;
CREATE POLICY "Policies are publicly readable when active"
    ON public.policies FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Admin can manage policies" ON public.policies;
CREATE POLICY "Admin can manage policies"
    ON public.policies FOR ALL
    USING (public.is_admin_or_staff(auth.uid()));

-- 4) AI Leads table for sales pipeline
CREATE TABLE IF NOT EXISTS public.ai_leads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    source_channel TEXT NOT NULL DEFAULT 'web',
    conversation_id UUID REFERENCES public.ai_conversations(id),
    lead_type TEXT NOT NULL DEFAULT 'general_inquiry',
    name TEXT,
    email TEXT,
    phone TEXT,
    preferred_contact TEXT,
    vehicle_year TEXT,
    vehicle_make TEXT,
    vehicle_model TEXT,
    tire_size TEXT,
    budget TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    assigned_to UUID REFERENCES auth.users(id),
    next_action_at TIMESTAMP WITH TIME ZONE,
    internal_notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.ai_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage AI leads" ON public.ai_leads;
CREATE POLICY "Admin can manage AI leads"
    ON public.ai_leads FOR ALL
    USING (public.is_admin_or_staff(auth.uid()));

-- 5) AI Lead Events (audit trail for leads)
CREATE TABLE IF NOT EXISTS public.ai_lead_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES public.ai_leads(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.ai_lead_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage lead events" ON public.ai_lead_events;
CREATE POLICY "Admin can manage lead events"
    ON public.ai_lead_events FOR ALL
    USING (public.is_admin_or_staff(auth.uid()));

-- 6) Notifications table for email logging
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    error TEXT,
    payload JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    sent_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view notifications" ON public.notifications;
CREATE POLICY "Admin can view notifications"
    ON public.notifications FOR SELECT
    USING (public.is_admin_or_staff(auth.uid()));

DROP POLICY IF EXISTS "Admin can update notifications" ON public.notifications;
CREATE POLICY "Admin can update notifications"
    ON public.notifications FOR UPDATE
    USING (public.is_admin_or_staff(auth.uid()));

-- 7) Claimed Orders table for guest order linking
CREATE TABLE IF NOT EXISTS public.claimed_orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    verification_method TEXT NOT NULL,
    UNIQUE(order_id, user_id)
);

ALTER TABLE public.claimed_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their claimed orders" ON public.claimed_orders;
CREATE POLICY "Users can view their claimed orders"
    ON public.claimed_orders FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can claim orders" ON public.claimed_orders;
CREATE POLICY "Authenticated users can claim orders"
    ON public.claimed_orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 8) Add updated_at triggers (drop first to avoid duplicates)
DROP TRIGGER IF EXISTS update_faq_entries_updated_at ON public.faq_entries;
CREATE TRIGGER update_faq_entries_updated_at
    BEFORE UPDATE ON public.faq_entries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_catalog_updated_at ON public.service_catalog;
CREATE TRIGGER update_service_catalog_updated_at
    BEFORE UPDATE ON public.service_catalog
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_policies_updated_at ON public.policies;
CREATE TRIGGER update_policies_updated_at
    BEFORE UPDATE ON public.policies
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_leads_updated_at ON public.ai_leads;
CREATE TRIGGER update_ai_leads_updated_at
    BEFORE UPDATE ON public.ai_leads
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9) Add audit triggers to new tables
DROP TRIGGER IF EXISTS audit_ai_leads ON public.ai_leads;
CREATE TRIGGER audit_ai_leads
    AFTER INSERT OR UPDATE OR DELETE ON public.ai_leads
    FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

DROP TRIGGER IF EXISTS audit_policies ON public.policies;
CREATE TRIGGER audit_policies
    AFTER INSERT OR UPDATE OR DELETE ON public.policies
    FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- 10) Insert default policies
INSERT INTO public.policies (key, title, content, category) VALUES
('delivery', 'Delivery Policy', 'Free delivery within Edmonton city limits. For areas outside Edmonton, shipping costs will be confirmed by our team after order placement. Pay on delivery - no upfront payment required.', 'delivery'),
('returns', 'Return Policy', 'We offer a 30-day satisfaction guarantee on all unused tires in original condition. Tires that have been mounted or driven on may only be returned if defective. Contact us within 30 days of purchase to initiate a return.', 'returns'),
('warranty', 'Warranty Policy', 'All tires come with the manufacturer''s warranty against defects in materials and workmanship. Typical coverage is 50,000 km or 1 year, whichever comes first. Warranty claims must be processed through our store.', 'warranty'),
('payment', 'Payment Policy', 'We accept cash and card payments in-person on delivery or at service completion. Online payments are coming soon. No upfront payment is required when placing an order.', 'payment'),
('installation', 'Installation Policy', 'Professional installation is available at our Edmonton location. Installation includes mounting, balancing, and torque to manufacturer specifications. Appointment recommended but walk-ins accepted based on availability.', 'services'),
('shipping', 'Shipping Policy', 'For orders outside Edmonton, shipping costs are quoted separately after order placement. We will contact you to confirm the shipping cost before dispatching your order. You may cancel if the shipping cost is not acceptable.', 'delivery'),
('privacy', 'Privacy Notice', 'We collect your information only to process orders and provide services. Your data is stored securely and never sold to third parties. See our full Privacy Policy page for details.', 'legal'),
('terms', 'Terms Summary', 'By placing an order, you agree to our terms of service including our return, warranty, and payment policies. All prices are subject to 5% GST. Full terms available on our Terms of Service page.', 'legal')
ON CONFLICT (key) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    category = EXCLUDED.category,
    updated_at = now();

-- 11) Insert default FAQ entries
INSERT INTO public.faq_entries (question, answer, tags, sort_order) VALUES
('What are your store hours?', 'We are open Monday through Saturday from 9:00 AM to 5:00 PM. We are closed on Sundays. Hours may vary on holidays.', ARRAY['hours', 'location'], 1),
('Do you offer free delivery?', 'Yes, we offer free delivery within Edmonton city limits. For areas outside Edmonton, we provide shipping quotes after you place your order.', ARRAY['delivery', 'shipping'], 2),
('How does payment work?', 'We operate on a Pay on Delivery model. You pay when you receive your tires or after service completion. We accept cash and card in-person. Online payments are coming soon.', ARRAY['payment', 'checkout'], 3),
('Do you install tires?', 'Yes, we offer professional tire installation at our Edmonton location. Services include mounting, balancing, and proper torque. We recommend booking an appointment.', ARRAY['services', 'installation'], 4),
('What is your return policy?', 'We offer a 30-day satisfaction guarantee on unused tires in original condition. Mounted or driven tires can only be returned if defective.', ARRAY['returns', 'warranty'], 5),
('Do you offer wholesale pricing?', 'Yes, we offer wholesale pricing for approved dealers. Apply through our Dealers page to get access to dealer pricing after approval.', ARRAY['dealer', 'wholesale'], 6),
('What tire sizes do you carry?', 'We carry a wide range of sizes from compact cars to trucks and SUVs. Use our Shop page to search by your exact tire size, or tell me your size and I can help find options.', ARRAY['products', 'tires'], 7),
('Do you offer tire rotation?', 'Yes, we offer tire rotation services to help extend the life of your tires. This service promotes even wear and better handling.', ARRAY['services', 'rotation'], 8);

-- 12) Insert default service catalog
INSERT INTO public.service_catalog (name, description, price_note, sort_order) VALUES
('Tire Installation', 'Professional mounting and balancing with torque to manufacturer specifications. Includes valve stem inspection.', 'Call for pricing', 1),
('Seasonal Changeover', 'Swap between your summer and winter tire sets. Includes mounting, balancing, and inspection.', 'Call for pricing', 2),
('Tire Rotation', 'Rotate tires to promote even wear and extend tire life. Visual inspection included.', 'Call for pricing', 3),
('Tire Repair', 'Professional puncture repair and damage assessment. Quick turnaround.', 'Starting at $25', 4),
('Wheel Balancing', 'Computer-assisted wheel balancing for smooth, vibration-free driving.', 'Call for pricing', 5),
('Tire Inspection', 'Comprehensive tire and wheel inspection. Tread depth measurement and condition report.', 'Free with service', 6);

-- 13) Add unique constraint to company_info key if not exists, then add geo
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_info_key_key') THEN
        ALTER TABLE public.company_info ADD CONSTRAINT company_info_key_key UNIQUE (key);
    END IF;
END $$;

-- Now insert geo coords
INSERT INTO public.company_info (key, value, category) VALUES
('latitude', '53.5461', 'location'),
('longitude', '-113.4938', 'location')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;