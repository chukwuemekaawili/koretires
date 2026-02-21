-- ============================================
-- Promo Codes System
-- ============================================

-- 1. Create promo_codes table
CREATE TABLE public.promo_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text UNIQUE NOT NULL,
    description text,
    discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value numeric NOT NULL CHECK (discount_value > 0),
    min_order_value numeric DEFAULT 0,
    max_uses integer,
    used_count integer NOT NULL DEFAULT 0,
    valid_from timestamptz DEFAULT now(),
    valid_until timestamptz,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Admin can manage promo codes
CREATE POLICY "Admins can manage promo codes"
ON public.promo_codes FOR ALL
TO authenticated
USING (public.is_admin_or_staff(auth.uid()))
WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_promo_codes_updated_at
    BEFORE UPDATE ON public.promo_codes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add promo fields to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS promo_code_id uuid REFERENCES public.promo_codes(id),
ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;

-- 3. RPC to validate a promo code (callable by anyone)
CREATE OR REPLACE FUNCTION public.validate_promo_code(p_code text, p_subtotal numeric)
RETURNS TABLE(
    id uuid,
    code text,
    discount_type text,
    discount_value numeric,
    discount_amount numeric,
    is_valid boolean,
    error_message text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    promo promo_codes%ROWTYPE;
    calc_discount numeric;
BEGIN
    -- Find the code (case-insensitive)
    SELECT * INTO promo FROM promo_codes pc
    WHERE UPPER(pc.code) = UPPER(p_code)
    AND pc.is_active = true;

    IF NOT FOUND THEN
        RETURN QUERY SELECT
            NULL::uuid, p_code, NULL::text, NULL::numeric, 0::numeric, false, 'Invalid promo code'::text;
        RETURN;
    END IF;

    -- Check validity dates
    IF promo.valid_from IS NOT NULL AND now() < promo.valid_from THEN
        RETURN QUERY SELECT
            promo.id, promo.code, promo.discount_type, promo.discount_value, 0::numeric, false, 'This code is not yet active'::text;
        RETURN;
    END IF;

    IF promo.valid_until IS NOT NULL AND now() > promo.valid_until THEN
        RETURN QUERY SELECT
            promo.id, promo.code, promo.discount_type, promo.discount_value, 0::numeric, false, 'This code has expired'::text;
        RETURN;
    END IF;

    -- Check max uses
    IF promo.max_uses IS NOT NULL AND promo.used_count >= promo.max_uses THEN
        RETURN QUERY SELECT
            promo.id, promo.code, promo.discount_type, promo.discount_value, 0::numeric, false, 'This code has reached its usage limit'::text;
        RETURN;
    END IF;

    -- Check minimum order value
    IF p_subtotal < promo.min_order_value THEN
        RETURN QUERY SELECT
            promo.id, promo.code, promo.discount_type, promo.discount_value, 0::numeric, false,
            ('Minimum order of $' || promo.min_order_value::text || ' required')::text;
        RETURN;
    END IF;

    -- Calculate discount
    IF promo.discount_type = 'percentage' THEN
        calc_discount := ROUND(p_subtotal * (promo.discount_value / 100), 2);
    ELSE
        calc_discount := LEAST(promo.discount_value, p_subtotal);
    END IF;

    RETURN QUERY SELECT
        promo.id, promo.code, promo.discount_type, promo.discount_value, calc_discount, true, NULL::text;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_promo_code(text, numeric) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_promo_code(text, numeric) TO authenticated;

-- 4. Function to increment used_count when an order uses a promo code
CREATE OR REPLACE FUNCTION public.increment_promo_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.promo_code_id IS NOT NULL AND (OLD IS NULL OR OLD.promo_code_id IS DISTINCT FROM NEW.promo_code_id) THEN
        UPDATE promo_codes SET used_count = used_count + 1 WHERE id = NEW.promo_code_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER increment_promo_usage_trigger
    AFTER INSERT OR UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.increment_promo_usage();

-- 5. Audit trigger
CREATE TRIGGER audit_promo_codes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.promo_codes
    FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
