/*
  # Add RLS policies for menus table

  1. Changes
    - Enable RLS on menus table
    - Add policies for staff access:
      - Operators can view menus
      - Admins can manage (create/update/delete) menus

  2. Security
    - Only authenticated staff can access menus
    - Admins have full CRUD access
    - Operators have read-only access
*/

-- Enable RLS on menus table (if not already enabled)
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated staff to view menus
CREATE POLICY "Staff can view menus"
  ON menus
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid()
    )
  );

-- Allow admins to manage menus
CREATE POLICY "Admins can manage menus"
  ON menus
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid()
      AND role = 'Administrador'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid()
      AND role = 'Administrador'
    )
  );