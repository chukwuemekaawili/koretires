-- Create bundles table
CREATE TABLE IF NOT EXISTS bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bundle_items table
CREATE TABLE IF NOT EXISTS bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID REFERENCES bundles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('product', 'service')),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  service_catalog_id UUID REFERENCES service_catalog(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bundle_items_bundle_id ON bundle_items(bundle_id);

-- Enable RLS
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_items ENABLE ROW LEVEL SECURITY;

-- Policies for bundles
CREATE POLICY "Public can view active bundles"
ON bundles FOR SELECT
TO public
USING (status = 'active');

CREATE POLICY "Admins can manage bundles"
ON bundles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policies for bundle_items
CREATE POLICY "Public can view bundle items for active bundles"
ON bundle_items FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM bundles
    WHERE bundles.id = bundle_items.bundle_id
    AND bundles.status = 'active'
  )
);

CREATE POLICY "Admins can manage bundle items"
ON bundle_items FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
