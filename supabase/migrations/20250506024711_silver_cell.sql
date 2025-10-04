/*
  # Fix products_with_variant_count view

  1. Changes
    - Drop existing view
    - Create new view with correct schema
    - Add proper category and variants count
    - Grant necessary permissions

  2. Security
    - Grant SELECT to authenticated users
    - No RLS needed on view (inherited from base tables)
*/

-- Drop the existing view if it exists
DROP VIEW IF EXISTS products_with_variant_count;

-- Create the view with the correct schema
CREATE OR REPLACE VIEW products_with_variant_count AS
SELECT 
  p.id,
  p.category_id,
  p.name,
  p.description,
  p.base_price,
  p.image_url,
  p.active,
  p.created_at,
  p.updated_at,
  c.name as category_name,
  COALESCE(COUNT(pv.variant_option_id) FILTER (WHERE pv.active = true), 0)::integer as variants_count
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
LEFT JOIN product_variants pv ON pv.product_id = p.id
GROUP BY p.id, p.category_id, p.name, p.description, p.base_price, p.image_url, p.active, p.created_at, p.updated_at, c.name;

-- Grant necessary permissions
GRANT SELECT ON products_with_variant_count TO authenticated;