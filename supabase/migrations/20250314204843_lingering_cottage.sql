/*
  # Remove redundant menu status column

  1. Changes
    - Drop status column from menus table first
    - Then drop menu_status_enum type if not used elsewhere
    - Keep active boolean for enabling/disabling menus

  2. Security
    - No security changes needed
    - Existing RLS policies remain intact
*/

-- First remove the column that depends on the type
ALTER TABLE menus DROP COLUMN IF EXISTS status;

-- Then check if menu_status_enum is used in other tables and drop if not
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE data_type = 'menu_status_enum'::regtype::text
  ) THEN
    DROP TYPE menu_status_enum;
  END IF;
END $$;