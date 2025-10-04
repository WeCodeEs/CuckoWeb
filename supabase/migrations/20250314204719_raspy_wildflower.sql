/*
  # Fix RLS policies for menus table - Final Version

  1. Changes
    - Drop existing policies
    - Create a single, simplified policy for staff access
    - Use a simpler check that avoids potential recursion
*/

-- First, ensure RLS is enabled
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "staff_select_menus" ON menus;
DROP POLICY IF EXISTS "staff_insert_menus" ON menus;
DROP POLICY IF EXISTS "staff_update_menus" ON menus;
DROP POLICY IF EXISTS "staff_delete_menus" ON menus;
DROP POLICY IF EXISTS "authenticated_staff_access" ON menus;
DROP POLICY IF EXISTS "Staff can view menus" ON menus;
DROP POLICY IF EXISTS "Admins can manage menus" ON menus;
DROP POLICY IF EXISTS "Staff can manage menus" ON menus;

-- Create a single policy with a simplified check
CREATE POLICY "staff_access_policy"
  ON menus
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