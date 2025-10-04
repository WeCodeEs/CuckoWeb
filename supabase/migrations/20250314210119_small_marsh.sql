/*
  # Add RLS policies for categories table

  1. Changes
    - Enable RLS on categories table
    - Add policies for staff access
    - Allow authenticated staff to manage categories

  2. Security
    - Only authenticated staff can access categories
    - Both admins and operators have full CRUD access
    - Maintain consistency with menus table policies
*/

-- First, ensure RLS is enabled
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "staff_access_policy" ON categories;

-- Create a single comprehensive policy for staff access
CREATE POLICY "staff_access_policy"
  ON categories
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