/*
  # Add customizable_ingredients column to products table

  1. Changes
    - Add JSONB column for customizable_ingredients to products table
    - Set default value to empty JSON object
    - Make column nullable

  2. Security
    - No security changes needed
    - Existing RLS policies remain intact
*/

-- Add customizable_ingredients column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS customizable_ingredients JSONB DEFAULT '{}'::jsonb;