-- Create a test customer
INSERT INTO customers (name, email, phone, preferred_contact)
VALUES ('Test Customer', 'test@example.com', '780-555-0000', 'email')
ON CONFLICT DO NOTHING;

-- Create test order with needs_stock_confirmation flag set to true
INSERT INTO orders (customer_id, subtotal, gst, total, status, fulfillment_method, needs_stock_confirmation)
SELECT 
  c.id,
  280.00,
  14.00,
  294.00,
  'pending',
  'pickup',
  true
FROM customers c
WHERE c.email = 'test@example.com'
LIMIT 1;