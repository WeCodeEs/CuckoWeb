/*
  # Add active column to staff_users table

  1. Changes
    - Add active boolean column with default true
    - Add index for faster filtering
    - No data migration needed as new column defaults to true

  2. Security
    - Existing RLS policies remain intact
*/

-- Add active column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'staff_users' 
    AND column_name = 'active'
  ) THEN
    ALTER TABLE staff_users
    ADD COLUMN active boolean NOT NULL DEFAULT true;

    -- Add index for filtering
    CREATE INDEX idx_staff_users_active ON staff_users(active);
  END IF;
END $$;