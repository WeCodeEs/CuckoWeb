/*
  # Add extra_price to ingredient_options table

  1. Changes
    - Add extra_price column with default 0
    - Add check constraint for non-negative values
    - Keep existing data and policies intact

  2. Security
    - No changes to RLS policies needed
    - Maintain existing security model
*/

ALTER TABLE ingredient_options 
ADD COLUMN extra_price DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE ingredient_options
ADD CONSTRAINT ingredient_options_extra_price_check 
CHECK (extra_price >= 0);