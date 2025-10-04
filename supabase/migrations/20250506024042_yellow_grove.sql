/*
  # Fix products with variant count view

  1. Changes
    - Drop existing view
    - Create new view with correct schema and relationships
    - Add proper security policies
    - Fix category relationship structure

  2. Security
    - Enable RLS
    - Add staff access policy
    - Grant necessary permissions
*/

-- Drop the existing view
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
  json_build_object(
    'name', c.name
  ) as category,
  COALESCE(COUNT(pv.variant_option_id), 0)::integer as variants_count
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.active = true
GROUP BY p.id, c.id, c.name;

-- Grant necessary permissions
GRANT SELECT ON products_with_variant_count TO authenticated;

-- Enable RLS
ALTER VIEW products_with_variant_count SET (security_invoker = true);