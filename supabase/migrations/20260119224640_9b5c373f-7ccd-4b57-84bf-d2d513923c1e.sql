-- Add SEO fields to pages table
ALTER TABLE public.pages 
ADD COLUMN IF NOT EXISTS canonical_url text,
ADD COLUMN IF NOT EXISTS noindex boolean DEFAULT false;

-- Ensure site_settings has proper descriptions for public vs admin keys
COMMENT ON TABLE public.site_settings IS 'Site-wide configuration. Some keys are public (gst, announcement), others admin-only.';

-- Create storage bucket for invoices if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for invoices bucket - only admin/staff can manage
CREATE POLICY "Admins can manage invoices storage" ON storage.objects
FOR ALL
USING (bucket_id = 'invoices' AND public.is_admin_or_staff(auth.uid()))
WITH CHECK (bucket_id = 'invoices' AND public.is_admin_or_staff(auth.uid()));

-- Also ensure customers can view their own invoices (by path pattern user_id/*)
CREATE POLICY "Users can view own invoice PDFs" ON storage.objects
FOR SELECT
USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);