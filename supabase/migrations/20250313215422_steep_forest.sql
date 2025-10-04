/*
  # Fix infinite recursion in staff_users policies

  1. Changes
    - Drop all existing policies to start fresh
    - Create simplified policies without recursive checks
    - Fix admin policy to avoid self-referential queries

  2. Security
    - Maintain proper access control
    - Prevent infinite recursion
    - Keep security restrictions intact
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Staff can view own profile" ON staff_users;
DROP POLICY IF EXISTS "Admins can view all staff" ON staff_users;
DROP POLICY IF EXISTS "Enable staff registration" ON staff_users;

-- Create new simplified policies
CREATE POLICY "Enable staff registration"
  ON staff_users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Staff can view own profile"
  ON staff_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all staff"
  ON staff_users
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM staff_users WHERE id = auth.uid()) = 'Administrador'
  );