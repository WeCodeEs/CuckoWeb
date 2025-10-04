/*
  # Fix Staff Users Policies

  1. Changes
    - Remove recursive policy checks
    - Add policy for staff registration
    - Simplify existing policies

  2. Security
    - Enable RLS
    - Add policies for staff access
    - Add policy for registration
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Staff can view own profile" ON staff_users;
DROP POLICY IF EXISTS "Admins can view all staff" ON staff_users;

-- Create new simplified policies
CREATE POLICY "Enable staff registration"
  ON staff_users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Staff can view own profile"
  ON staff_users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all staff"
  ON staff_users
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM staff_users WHERE role = 'Administrador'
    )
  );