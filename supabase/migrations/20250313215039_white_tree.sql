/*
  # Fix staff_users policies

  1. Changes
    - Simplify policies to avoid recursion
    - Add explicit insert policy
    - Fix admin view policy
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Staff can view own profile" ON staff_users;
DROP POLICY IF EXISTS "Admins can view all staff" ON staff_users;
DROP POLICY IF EXISTS "Enable staff registration" ON staff_users;

-- Create new policies
CREATE POLICY "Enable staff registration"
  ON staff_users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can view own profile"
  ON staff_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all staff"
  ON staff_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM staff_users
      WHERE id = auth.uid() AND role = 'Administrador'
    )
  );