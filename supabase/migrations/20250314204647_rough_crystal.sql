/*
  # Fix RLS policies for menus table - Final Version

  1. Changes
    - Drop existing policies
    - Create simplified policy for staff access
    - Add separate policies for different operations
    - Ensure proper authentication checks
*/

-- First, ensure RLS is enabled
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Staff can view menus" ON menus;
DROP POLICY IF EXISTS "Admins can manage menus" ON menus;
DROP POLICY IF EXISTS "Staff can manage menus" ON menus;
DROP POLICY IF EXISTS "authenticated_staff_access" ON menus;

-- Create separate policies for different operations
CREATE POLICY "staff_select_menus"
  ON menus
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid()
      AND role IN ('Administrador', 'Operador')
    )
  );

CREATE POLICY "staff_insert_menus"
  ON menus
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid()
      AND role IN ('Administrador', 'Operador')
    )
  );

CREATE POLICY "staff_update_menus"
  ON menus
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid()
      AND role IN ('Administrador', 'Operador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid()
      AND role IN ('Administrador', 'Operador')
    )
  );

CREATE POLICY "staff_delete_menus"
  ON menus
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid()
      AND role IN ('Administrador', 'Operador')
    )
  );