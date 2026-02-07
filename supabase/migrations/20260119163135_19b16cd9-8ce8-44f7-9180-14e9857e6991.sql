-- Create audit log trigger function
CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_log (table_name, action, record_id, old_values, user_id)
        VALUES (TG_TABLE_NAME, TG_OP, OLD.id, to_jsonb(OLD), auth.uid());
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_log (table_name, action, record_id, old_values, new_values, user_id)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.id, to_jsonb(OLD), to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_log (table_name, action, record_id, new_values, user_id)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.id, to_jsonb(NEW), auth.uid());
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;

-- Create triggers for products table
DROP TRIGGER IF EXISTS audit_products_trigger ON public.products;
CREATE TRIGGER audit_products_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Create triggers for orders table
DROP TRIGGER IF EXISTS audit_orders_trigger ON public.orders;
CREATE TRIGGER audit_orders_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Create triggers for dealers table
DROP TRIGGER IF EXISTS audit_dealers_trigger ON public.dealers;
CREATE TRIGGER audit_dealers_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.dealers
    FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Create triggers for order_items table
DROP TRIGGER IF EXISTS audit_order_items_trigger ON public.order_items;
CREATE TRIGGER audit_order_items_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.order_items
    FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Create triggers for invoices table
DROP TRIGGER IF EXISTS audit_invoices_trigger ON public.invoices;
CREATE TRIGGER audit_invoices_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Create triggers for dealer_quotes table
DROP TRIGGER IF EXISTS audit_dealer_quotes_trigger ON public.dealer_quotes;
CREATE TRIGGER audit_dealer_quotes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.dealer_quotes
    FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();