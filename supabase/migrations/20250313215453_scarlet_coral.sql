/*
  # Fix infinite recursion in staff_users policies - Final Version

  1. Changes
    - Drop existing policies
    - Create new policies using security definer functions
    - Avoid recursive queries completely
    - Implement proper role-based access control

  2. Security
    - Maintain proper access control
    - Prevent infinite recursion
    - Keep security restrictions intact
*/

-- First, create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM staff_users
    WHERE id = user_id 
    AND role = 'Administrador'
  );
$$;

-- Drop all existing policies
DROP POLICY IF EXISTS "Staff can view own profile" ON staff_users;
DROP POLICY IF EXISTS "Admins can view all staff" ON staff_users;
DROP POLICY IF EXISTS "Enable staff registration" ON staff_users;

-- Create new policies using the security definer function
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

CREATE POLICY "Admins can manage all staff"
  ON staff_users
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));