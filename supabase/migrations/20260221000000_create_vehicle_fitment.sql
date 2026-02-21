-- Create vehicles table for Shop by Vehicle lookup
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  trim TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(year, make, model, trim)
);

-- Create junction table for vehicle tire sizes
CREATE TABLE IF NOT EXISTS vehicle_tire_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  tire_size TEXT NOT NULL, -- e.g. "225/65R17"
  is_front BOOLEAN DEFAULT false, -- For staggered setups (e.g. front size vs rear size), normally false
  is_rear BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vehicle_id, tire_size)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS vehicles_ymm_idx ON vehicles(year, make, model);
CREATE INDEX IF NOT EXISTS vehicle_tire_sizes_vehicle_id_idx ON vehicle_tire_sizes(vehicle_id);

-- Enable RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_tire_sizes ENABLE ROW LEVEL SECURITY;

-- Policies: public can read, admin can manage
CREATE POLICY "Public can view vehicles"
ON vehicles FOR SELECT
TO public
USING (true);

CREATE POLICY "Admins can manage vehicles"
ON vehicles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Public can view vehicle tire sizes"
ON vehicle_tire_sizes FOR SELECT
TO public
USING (true);

CREATE POLICY "Admins can manage vehicle tire sizes"
ON vehicle_tire_sizes FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Seed some sample data for testing (optional but helpful)
-- Only insert if the tables are empty to avoid duplicates
DO $$
DECLARE
  rav4_2024_id UUID;
  f150_2023_id UUID;
  civic_2022_id UUID;
  model3_2024_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vehicles LIMIT 1) THEN
    -- Insert vehicles
    INSERT INTO vehicles (year, make, model, trim) VALUES (2024, 'Toyota', 'RAV4', 'XLE') RETURNING id INTO rav4_2024_id;
    INSERT INTO vehicles (year, make, model, trim) VALUES (2023, 'Ford', 'F-150', 'XLT') RETURNING id INTO f150_2023_id;
    INSERT INTO vehicles (year, make, model, trim) VALUES (2022, 'Honda', 'Civic', 'EX') RETURNING id INTO civic_2022_id;
    INSERT INTO vehicles (year, make, model, trim) VALUES (2024, 'Tesla', 'Model 3', 'Long Range') RETURNING id INTO model3_2024_id;

    -- Insert corresponding tire sizes
    INSERT INTO vehicle_tire_sizes (vehicle_id, tire_size) VALUES 
      (rav4_2024_id, '225/65R17'),
      (f150_2023_id, '275/65R18'),
      (civic_2022_id, '215/50R17'),
      (model3_2024_id, '235/45R18');
  END IF;
END $$;
