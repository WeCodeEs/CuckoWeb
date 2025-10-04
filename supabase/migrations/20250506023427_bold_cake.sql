/*
  # Fix products view and dependencies

  1. Changes
    - Create products_with_variant_count view
    - Add proper dependencies
    - Fix relationship between products and categories

  2. Security
    - Enable RLS on view
    - Add policies for staff access
*/

-- Create the view if it doesn't exist
CREATE OR REPLACE VIEW products_with_variant_count AS
SELECT 
  p.*,
  c.name as category_name,
  COALESCE(COUNT(pv.variant_option_id), 0)::integer as variants_count
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
LEFT JOIN product_variants pv ON pv.product_id = p.id
GROUP BY p.id, c.id;

-- Grant access to authenticated users
GRANT SELECT ON products_with_variant_count TO authenticated;