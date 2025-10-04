/*
  # Remove description column from variants table

  1. Changes
    - Drop description column from variants table
    - No data migration needed as the field is being removed
    - Existing RLS policies remain intact

  2. Notes
    - This is a non-reversible change unless backed up
    - No impact on existing functionality as field is unused
*/

ALTER TABLE variants
DROP COLUMN IF EXISTS description;