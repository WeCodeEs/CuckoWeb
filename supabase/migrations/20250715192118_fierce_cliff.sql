/*
  # Drop unique constraint from order_details

  This migration removes the unique_product_variant_per_order constraint that was preventing
  valid cart items with the same product and variant but different customizable ingredients.
  The application handles merging truly identical items at the business logic level.
*/

ALTER TABLE public.order_details
  DROP CONSTRAINT IF EXISTS unique_product_variant_per_order;