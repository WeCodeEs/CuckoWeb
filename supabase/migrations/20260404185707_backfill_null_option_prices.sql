/*
  # Backfill NULL additional_price in product_option_group_options

  1. Changes
    - Updates `product_option_group_options` rows where `additional_price` is NULL
    - Sets them to the corresponding base price from the `options` table
    - This ensures all consumers (admin panel, mobile app) always see a valid price

  2. Affected Tables
    - `product_option_group_options`: backfills NULL additional_price values

  3. Notes
    - This is a one-time data fix for existing records
    - Going forward, the admin panel already fills in the base price when no override is specified
*/

UPDATE product_option_group_options pogo
SET additional_price = o.additional_price
FROM options o
WHERE pogo.option_id = o.id
  AND pogo.additional_price IS NULL;
