-- ============================================
-- Order Status History for Customer Tracking
-- ============================================

-- 1. Create order_status_history table
CREATE TABLE public.order_status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status text NOT NULL,
    note text,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Admin can manage all history
CREATE POLICY "Admins can manage order status history"
ON public.order_status_history FOR ALL
TO authenticated
USING (public.is_admin_or_staff(auth.uid()))
WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- Customers can view history for their own orders
CREATE POLICY "Customers can view own order history"
ON public.order_status_history FOR SELECT
TO authenticated
USING (
    order_id IN (
        SELECT o.id FROM public.orders o WHERE o.user_id = auth.uid()
    )
);

-- Guest users can view via RPC (not direct table access)

-- 2. Auto-log status changes via trigger
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- On INSERT, log initial status
    IF TG_OP = 'INSERT' THEN
        INSERT INTO order_status_history (order_id, status, note)
        VALUES (NEW.id, NEW.status, 'Order placed');
    END IF;

    -- On UPDATE, log if status changed
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO order_status_history (order_id, status, created_by)
        VALUES (NEW.id, NEW.status, auth.uid());
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER log_order_status_trigger
    AFTER INSERT OR UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();

-- 3. RPC for guests to view order history by order number + email
CREATE OR REPLACE FUNCTION public.get_order_tracking(p_order_number text, p_email text)
RETURNS TABLE(
    order_id uuid,
    order_number text,
    status text,
    total numeric,
    fulfillment_method text,
    created_at timestamptz,
    history_status text,
    history_note text,
    history_created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id as order_id,
        o.order_number,
        o.status,
        o.total,
        o.fulfillment_method,
        o.created_at,
        h.status as history_status,
        h.note as history_note,
        h.created_at as history_created_at
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    LEFT JOIN order_status_history h ON h.order_id = o.id
    WHERE o.order_number = p_order_number
      AND c.email = p_email
    ORDER BY h.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_tracking(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_order_tracking(text, text) TO authenticated;
