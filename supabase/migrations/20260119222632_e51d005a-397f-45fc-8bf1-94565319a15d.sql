-- Initialize inventory records for all products that don't have one
INSERT INTO inventory (product_id, qty_on_hand, qty_reserved, reorder_level)
SELECT 
  p.id,
  FLOOR(RANDOM() * 20 + 5)::integer,  -- Random initial stock 5-25
  0,
  4  -- Default reorder level
FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM inventory i WHERE i.product_id = p.id
)
ON CONFLICT (product_id) DO NOTHING;