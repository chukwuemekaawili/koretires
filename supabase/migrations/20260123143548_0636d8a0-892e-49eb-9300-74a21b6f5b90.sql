-- Drop the view entirely - we'll use only RPCs for data access
-- This is the cleanest and most secure approach
DROP VIEW IF EXISTS products_public;