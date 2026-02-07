-- ==========================================
-- 1) PAGES & PAGE_SECTIONS for CMS Page Builder
-- ==========================================

CREATE TABLE public.pages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    title text NOT NULL,
    seo_title text,
    seo_description text,
    og_image text,
    is_active boolean DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pages" ON public.pages
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage pages" ON public.pages
    FOR ALL USING (public.is_admin_or_staff(auth.uid()));

CREATE TABLE public.page_sections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    section_key text NOT NULL,
    section_type text NOT NULL DEFAULT 'content',
    sort_order integer DEFAULT 0,
    content_json jsonb NOT NULL DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(page_id, section_key)
);

ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active sections" ON public.page_sections
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage sections" ON public.page_sections
    FOR ALL USING (public.is_admin_or_staff(auth.uid()));

-- ==========================================
-- 2) INVENTORY TABLE (one row per product)
-- ==========================================

CREATE TABLE public.inventory (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid UNIQUE NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    qty_on_hand integer NOT NULL DEFAULT 0,
    qty_reserved integer NOT NULL DEFAULT 0,
    reorder_level integer,
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view inventory" ON public.inventory
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage inventory" ON public.inventory
    FOR ALL USING (public.is_admin_or_staff(auth.uid()));

-- ==========================================
-- 3) INVENTORY_MOVEMENTS for audit trail
-- ==========================================

CREATE TABLE public.inventory_movements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    delta_qty integer NOT NULL,
    reason text NOT NULL,
    reference_type text, -- 'manual', 'order', 'import', 'adjustment', 'fulfillment', 'cancel'
    reference_id uuid,
    notes text,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view movements" ON public.inventory_movements
    FOR SELECT USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins can create movements" ON public.inventory_movements
    FOR INSERT WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- ==========================================
-- 4) ADD needs_stock_confirmation to orders
-- ==========================================

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS needs_stock_confirmation boolean DEFAULT false;

-- ==========================================
-- 5) EXTEND site_settings with additional keys
-- ==========================================

INSERT INTO public.site_settings (key, value, description) VALUES
('online_payments', '{"enabled": false, "coming_soon": true}', 'Online payment configuration'),
('announcement_banner', '{"active": false, "title": "", "body": "", "type": "info"}', 'Global announcement banner'),
('payment_messaging', '{"checkout_text": "Pay in-person on delivery or pickup. Cash or card accepted.", "online_coming_soon_text": "Online payments: Coming Soon"}', 'Payment messaging configuration'),
('ai_settings', '{"enabled": true, "lead_capture_enabled": true, "handoff_suggest_call": true, "handoff_suggest_whatsapp": true}', 'AI agent configuration')
ON CONFLICT (key) DO NOTHING;

-- ==========================================
-- 6) Triggers for updated_at
-- ==========================================

CREATE TRIGGER update_pages_updated_at
    BEFORE UPDATE ON public.pages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_page_sections_updated_at
    BEFORE UPDATE ON public.page_sections
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON public.inventory
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- 7) Audit triggers for new tables
-- ==========================================

CREATE TRIGGER audit_pages_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.pages
    FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_page_sections_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.page_sections
    FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_inventory_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.inventory
    FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();