/*
  # Fix admin access policies

  1. Changes
    - Drop existing policies
    - Create new policies that properly handle admin access
    - Add policies for all CRUD operations for admins
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Staff can view own profile" ON staff_users;
DROP POLICY IF EXISTS "Admins can view all staff" ON staff_users;
DROP POLICY IF EXISTS "Enable staff registration" ON staff_users;
DROP POLICY IF EXISTS "Admins can view all staff" ON staff_users;

-- Create comprehensive policies for staff and admin access
CREATE POLICY "Staff can view own profile"
  ON staff_users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM staff_users 
      WHERE id = auth.uid() AND role = 'Administrador'
    )
  );

CREATE POLICY "Staff can update own profile"
  ON staff_users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable staff registration"
  ON staff_users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all staff"
  ON staff_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users 
      WHERE id = auth.uid() AND role = 'Administrador'
    )
  );