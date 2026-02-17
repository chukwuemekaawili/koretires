-- Create company_info table for business settings used by AI concierge
CREATE TABLE IF NOT EXISTS public.company_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(category, key)
);

-- Enable RLS
ALTER TABLE public.company_info ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view company info" ON public.company_info FOR SELECT USING (true);
CREATE POLICY "Admins can manage company info" ON public.company_info FOR ALL USING (is_admin_or_staff(auth.uid()));

-- Insert default company info
INSERT INTO public.company_info (category, key, value) VALUES
  ('contact', 'phone', '780-455-1251'),
  ('contact', 'email', 'edmonton@koretires.com'),
  ('contact', 'whatsapp', '+1 780 455 1251'),
  ('location', 'address', '12345 Yellowhead Trail NW'),
  ('location', 'city', 'Edmonton'),
  ('location', 'province', 'Alberta'),
  ('location', 'postal_code', 'T5L 3C4'),
  ('hours', 'hours_monday', '8:00 AM - 6:00 PM'),
  ('hours', 'hours_tuesday', '8:00 AM - 6:00 PM'),
  ('hours', 'hours_wednesday', '8:00 AM - 6:00 PM'),
  ('hours', 'hours_thursday', '8:00 AM - 6:00 PM'),
  ('hours', 'hours_friday', '8:00 AM - 6:00 PM'),
  ('hours', 'hours_saturday', '9:00 AM - 4:00 PM'),
  ('hours', 'hours_sunday', 'Closed'),
  ('policies', 'delivery_policy', 'Free delivery within Edmonton'),
  ('policies', 'return_policy', '30-day satisfaction guarantee'),
  ('policies', 'warranty_policy', 'Manufacturer warranty included'),
  ('policies', 'payment_policy', 'Pay on delivery - cash or card'),
  ('policies', 'installation_policy', 'Professional installation available')
ON CONFLICT (category, key) DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_company_info_updated_at
  BEFORE UPDATE ON public.company_info
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();