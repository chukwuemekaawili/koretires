-- Fix security issues for customers, ai_leads, ai_conversations, and uploads storage bucket

-- 1. Remove public SELECT access from customers table
-- The table already has proper policies: "Users can view own customer record" and "Admins can manage customers"
-- But there's likely a permissive policy we need to remove. Let's ensure only proper policies exist.

-- First, drop any overly permissive policies that might exist on customers
DROP POLICY IF EXISTS "Anyone can view customers" ON public.customers;
DROP POLICY IF EXISTS "Public can view customers" ON public.customers;
DROP POLICY IF EXISTS "Anyone can read customers" ON public.customers;

-- 2. Remove public SELECT access from ai_leads table
-- It already has "Admin can manage AI leads" but may have a public read policy
DROP POLICY IF EXISTS "Anyone can view leads" ON public.ai_leads;
DROP POLICY IF EXISTS "Public can view leads" ON public.ai_leads;
DROP POLICY IF EXISTS "Anyone can read leads" ON public.ai_leads;
DROP POLICY IF EXISTS "Public can read ai_leads" ON public.ai_leads;

-- 3. Fix ai_conversations permissive UPDATE policy
-- Drop the "Anyone can update conversations by session" policy - edge functions use service role key anyway
DROP POLICY IF EXISTS "Anyone can update conversations by session" ON public.ai_conversations;

-- 4. Fix uploads storage bucket - make it more restrictive
-- Update the bucket to be private (will need signed URLs for access)
UPDATE storage.buckets SET public = false WHERE id = 'uploads';

-- Drop overly permissive storage policies
DROP POLICY IF EXISTS "Anyone can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view uploaded files" ON storage.objects;

-- Create restricted policies for uploads bucket
-- Authenticated users can upload to their own folder
CREATE POLICY "Authenticated users can upload to uploads bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can view their own uploads
CREATE POLICY "Users can view own uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can manage all uploads
CREATE POLICY "Admins can manage all uploads"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'uploads'
  AND public.is_admin_or_staff(auth.uid())
)
WITH CHECK (
  bucket_id = 'uploads'
  AND public.is_admin_or_staff(auth.uid())
);