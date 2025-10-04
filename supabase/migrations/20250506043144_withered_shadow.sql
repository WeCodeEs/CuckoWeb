/*
  # Add additional_price column to variant_options table

  1. Changes
    - Add `additional_price` column to `variant_options` table with numeric type
    - Set default value to 0
    - Add check constraint to ensure price is not negative

  2. Notes
    - Uses IF NOT EXISTS to prevent errors if column already exists
    - Adds check constraint for data validation
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'variant_options' 
    AND column_name = 'additional_price'
  ) THEN
    ALTER TABLE variant_options 
    ADD COLUMN additional_price numeric(10,2) DEFAULT 0 NOT NULL;

    ALTER TABLE variant_options
    ADD CONSTRAINT variant_options_additional_price_check 
    CHECK (additional_price >= 0);
  END IF;
END $$;