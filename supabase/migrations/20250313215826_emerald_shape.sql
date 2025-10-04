/*
  # Fix staff_users table and policies

  1. Changes
    - Remove password column from staff_users as it's handled by auth.users
    - Update policies for better security
*/

-- First drop the password column since it's redundant with auth.users
ALTER TABLE staff_users 
DROP COLUMN IF EXISTS password;

-- Drop existing policies
DROP POLICY IF EXISTS "Staff can view own profile" ON staff_users;
DROP POLICY IF EXISTS "Admins can view all staff" ON staff_users;
DROP POLICY IF EXISTS "Enable staff registration" ON staff_users;
DROP POLICY IF EXISTS "Admins can manage all staff" ON staff_users;

-- Create simplified policies
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
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM staff_users
      WHERE id = auth.uid() AND role = 'Administrador'
    )
  );