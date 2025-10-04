/*
  # Add RLS policies for products table

  1. Changes
    - Enable RLS on products table
    - Add policies for staff access
    - Allow authenticated staff to manage products

  2. Security
    - Only authenticated staff can access products
    - Both admins and operators have full CRUD access
    - Maintain consistency with other table policies
*/

-- First, ensure RLS is enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "staff_access_policy" ON products;

-- Create a single comprehensive policy for staff access
CREATE POLICY "staff_access_policy"
  ON products
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