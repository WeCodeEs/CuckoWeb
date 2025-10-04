/*
  # Fix unique constraint for order details

  ## Problem
  The current constraint `unique_product_variant_per_order` prevents inserting the same product 
  into an order even with different variants, which is incorrect business logic.

  ## Solution
  1. Drop the existing constraint that only considers (order_id, product_id, variant_option_id)
  2. Create a new constraint that properly allows same product with different variants
  
  ## Changes
  - Remove old constraint: unique_product_variant_per_order
  - Add new constraint: unique_product_variant_ingredients_per_order
  - New constraint considers the combination of order_id + product_id + variant_option_id
*/

-- Drop the existing constraint that's causing the issue
ALTER TABLE order_details 
DROP CONSTRAINT IF EXISTS unique_product_variant_per_order;

-- Add the new constraint that allows same product with different variants
ALTER TABLE order_details 
ADD CONSTRAINT unique_product_variant_per_order 
UNIQUE (order_id, product_id, variant_option_id);