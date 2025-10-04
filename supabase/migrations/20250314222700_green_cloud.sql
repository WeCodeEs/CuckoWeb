/*
  # Add RLS policies for variants table

  1. Changes
    - Enable RLS on variants table
    - Add policies for staff access
    - Ensure proper authentication checks

  2. Security
    - Only authenticated staff can access variants
    - Maintain consistency with other table policies
*/

-- Enable RLS on variants table
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policy for staff access
CREATE POLICY "staff_access_policy"
  ON variants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM staff_users 
      WHERE staff_users.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM staff_users 
      WHERE staff_users.id = auth.uid()
    )
  );