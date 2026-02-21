-- Create the storage bucket for product images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow anyone to view images
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
CREATE POLICY "Anyone can view product images"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'product-images' );

-- Policy to allow admin/staff to upload images
DROP POLICY IF EXISTS "Admin/Staff can upload product images" ON storage.objects;
CREATE POLICY "Admin/Staff can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images' 
    AND auth.role() = 'authenticated'
    AND public.is_admin_or_staff(auth.uid())
  );

-- Policy to allow admin/staff to update images
DROP POLICY IF EXISTS "Admin/Staff can update product images" ON storage.objects;
CREATE POLICY "Admin/Staff can update product images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images' 
    AND auth.role() = 'authenticated'
    AND public.is_admin_or_staff(auth.uid())
  );

-- Policy to allow admin/staff to delete images
DROP POLICY IF EXISTS "Admin/Staff can delete product images" ON storage.objects;
CREATE POLICY "Admin/Staff can delete product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images' 
    AND auth.role() = 'authenticated'
    AND public.is_admin_or_staff(auth.uid())
  );
