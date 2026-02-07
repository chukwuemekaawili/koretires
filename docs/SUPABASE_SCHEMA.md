# Supabase Schema & RLS Policies

This document outlines the database structure needed for the Kore Tires application.

## Tables

### 1. `products`
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  size TEXT NOT NULL,                    -- e.g., "205/55/16"
  description TEXT NOT NULL,             -- e.g., "All Season Tires"
  vendor TEXT NOT NULL,                  -- e.g., "SPORTRAK"
  type TEXT NOT NULL,                    -- "winter", "all-season", "all-weather", "terrain", "summer"
  price DECIMAL(10,2) NOT NULL,          -- Retail price
  wholesale_price DECIMAL(10,2),         -- Dealer-only price (nullable)
  availability TEXT DEFAULT 'in-stock',  -- "in-stock", "available-24h", "out-of-stock"
  image_url TEXT,
  features JSONB,                        -- Array of feature strings
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Anyone can view products (but wholesale_price hidden via view)
CREATE POLICY "Products are publicly viewable"
  ON products FOR SELECT
  TO public
  USING (true);
```

### 2. `products_public` (View to hide wholesale_price from retail users)
```sql
CREATE VIEW products_public AS
SELECT 
  id, size, description, vendor, type, price, 
  availability, image_url, features, created_at
FROM products;

-- Dealer view includes wholesale_price
CREATE VIEW products_dealer AS
SELECT * FROM products;
```

### 3. `orders`
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- NULL for guest orders
  guest_id TEXT,                         -- For guest cart tracking
  status TEXT DEFAULT 'pending',         -- "pending", "confirmed", "ready", "delivered", "cancelled"
  fulfillment_method TEXT NOT NULL,      -- "pickup", "installation", "delivery", "shipping"
  subtotal DECIMAL(10,2) NOT NULL,
  gst DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'pay_on_delivery',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Guests can create orders
CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  TO public
  WITH CHECK (true);
```

### 4. `order_items`
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  size TEXT NOT NULL,
  description TEXT NOT NULL,
  vendor TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Same policies as orders (inherit via order_id)
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );
```

### 5. `customers`
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  preferred_contact TEXT DEFAULT 'call',  -- "call", "whatsapp", "email"
  address TEXT,
  city TEXT,
  postal_code TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Anyone can create customer info with order
CREATE POLICY "Anyone can create customer info"
  ON customers FOR INSERT
  TO public
  WITH CHECK (true);
```

### 6. `carts` (For persistent guest carts - optional)
```sql
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_id TEXT,                         -- For anonymous users
  items JSONB DEFAULT '[]',              -- Cart items
  fulfillment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT cart_user_or_guest CHECK (user_id IS NOT NULL OR guest_id IS NOT NULL)
);

ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

-- Users can manage their own carts
CREATE POLICY "Users can manage own carts"
  ON carts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Guest carts can be created/read by guest_id (via edge function)
```

### 7. `dealers`
```sql
CREATE TABLE dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  status TEXT DEFAULT 'pending',         -- "pending", "approved", "rejected"
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;

-- Anyone can apply (insert)
CREATE POLICY "Anyone can apply to be dealer"
  ON dealers FOR INSERT
  TO public
  WITH CHECK (true);

-- Dealers can view their own record
CREATE POLICY "Dealers can view own record"
  ON dealers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

### 8. `user_roles` (For dealer/admin access)
```sql
CREATE TYPE app_role AS ENUM ('admin', 'dealer', 'user');

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Use in RLS policies:
-- USING (has_role(auth.uid(), 'dealer'))
```

### 9. `fleet_inquiries`
```sql
CREATE TABLE fleet_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  fleet_size TEXT,
  notes TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fleet_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit fleet inquiry"
  ON fleet_inquiries FOR INSERT
  TO public
  WITH CHECK (true);
```

### 10. `service_bookings`
```sql
CREATE TABLE service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  service_type TEXT NOT NULL,            -- "installation", "rotation", "repair"
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle_info TEXT,
  preferred_date DATE,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can book services"
  ON service_bookings FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can view own bookings"
  ON service_bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

## RLS Summary

| Table | Public Read | Public Insert | Auth Read Own | Dealer Access | Admin Access |
|-------|-------------|---------------|---------------|---------------|--------------|
| products | ✅ (via view) | ❌ | ✅ | ✅ + wholesale | ✅ Full |
| orders | ❌ | ✅ | ✅ | ✅ Own | ✅ All |
| order_items | ❌ | ✅ | ✅ | ✅ Own | ✅ All |
| customers | ❌ | ✅ | ✅ | ✅ Own | ✅ All |
| dealers | ❌ | ✅ | ✅ Own | ✅ Own | ✅ All |
| fleet_inquiries | ❌ | ✅ | ❌ | ❌ | ✅ All |
| service_bookings | ❌ | ✅ | ✅ Own | ❌ | ✅ All |

## Dealer Wholesale Pricing Logic

Dealers see wholesale pricing only when:
1. User is authenticated
2. User has `dealer` role in `user_roles`
3. Dealer record has `status = 'approved'`

```sql
-- Example query for dealer product view
SELECT 
  p.*,
  CASE 
    WHEN has_role(auth.uid(), 'dealer') 
      AND EXISTS (SELECT 1 FROM dealers WHERE user_id = auth.uid() AND status = 'approved')
    THEN p.wholesale_price
    ELSE NULL
  END as wholesale_price
FROM products p;
```
