-- 1. Add document_url column to dealers table for file uploads
ALTER TABLE public.dealers 
ADD COLUMN IF NOT EXISTS document_url TEXT;

-- 2. Create a function to auto-queue review requests 24h after order completion
CREATE OR REPLACE FUNCTION public.auto_queue_review_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only trigger when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Check if a review request already exists for this order
    IF NOT EXISTS (
      SELECT 1 FROM public.review_requests 
      WHERE order_id = NEW.id
    ) THEN
      -- Insert a review request with a scheduled send time (24h from now)
      INSERT INTO public.review_requests (
        order_id,
        customer_id,
        email,
        phone,
        status,
        review_url
      )
      SELECT 
        NEW.id,
        NEW.customer_id,
        c.email,
        c.phone,
        'scheduled',
        'https://g.page/r/koretires/review'  -- Google review URL placeholder
      FROM public.customers c
      WHERE c.id = NEW.customer_id
        AND c.email IS NOT NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 3. Create trigger on orders table for automatic review request
DROP TRIGGER IF EXISTS trigger_auto_queue_review_request ON public.orders;
CREATE TRIGGER trigger_auto_queue_review_request
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_queue_review_request();

-- 4. Add scheduled_for column to review_requests for delayed sending
ALTER TABLE public.review_requests 
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ DEFAULT (now() + interval '24 hours');

-- 5. Create storage policy for dealer documents (if not exists)
DO $$
BEGIN
  -- Check if bucket exists, if not create it
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('dealer-documents', 'dealer-documents', false)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Bucket may already exist
END $$;

-- 6. Storage policies for dealer documents
DROP POLICY IF EXISTS "Dealers can upload their own documents" ON storage.objects;
CREATE POLICY "Dealers can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'dealer-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Dealers can view their own documents" ON storage.objects;
CREATE POLICY "Dealers can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'dealer-documents' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR is_admin_or_staff(auth.uid())
  )
);

DROP POLICY IF EXISTS "Admins can view all dealer documents" ON storage.objects;
CREATE POLICY "Admins can view all dealer documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'dealer-documents' 
  AND is_admin_or_staff(auth.uid())
);