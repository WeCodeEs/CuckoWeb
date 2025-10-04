/*
  # Update RLS policies for menus table

  1. Changes
    - Drop existing policies
    - Add new policies that allow both administrators and operators to manage menus
    - Keep RLS enabled for security

  2. Security
    - Only authenticated staff can access menus
    - Both admins and operators have full CRUD access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Staff can view menus" ON menus;
DROP POLICY IF EXISTS "Admins can manage menus" ON menus;

-- Create new policy for staff management
CREATE POLICY "Staff can manage menus"
  ON menus
  FOR ALL
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