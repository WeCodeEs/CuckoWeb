/*
  # Fix staff registration policies

  1. Changes
    - Drop existing policies to avoid conflicts
    - Create new policies for staff registration and access
    - Ensure authenticated users can insert into staff_users
    - Allow staff to view their own profile
    - Allow admins to view all staff profiles

  2. Security
    - Enable RLS
    - Add specific policies for INSERT and SELECT operations
    - Restrict access based on user role and ownership
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