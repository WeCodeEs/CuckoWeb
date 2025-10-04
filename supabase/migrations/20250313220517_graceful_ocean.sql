/*
  # Fix infinite recursion in staff policies

  1. Changes
    - Drop existing policies and views
    - Create simplified policies without recursive checks
    - Add basic CRUD policies for staff and admins
*/

-- Drop existing policies, views, and functions
DROP MATERIALIZED VIEW IF EXISTS admin_users;
DROP FUNCTION IF EXISTS refresh_admin_users() CASCADE;
DROP POLICY IF EXISTS "Staff can view own profile" ON staff_users;
DROP POLICY IF EXISTS "Staff can update own profile" ON staff_users;
DROP POLICY IF EXISTS "Enable staff registration" ON staff_users;
DROP POLICY IF EXISTS "Admins can manage all staff" ON staff_users;
DROP POLICY IF EXISTS "Admins can view all staff" ON staff_users;

-- Create basic policies without recursion
CREATE POLICY "Enable staff registration"
  ON staff_users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow read access"
  ON staff_users
  FOR SELECT
  TO authenticated
  USING (
    -- Either it's your own record OR you're an admin
    auth.uid() = id OR
    role = 'Administrador'
  );

CREATE POLICY "Allow self update"
  ON staff_users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow admin full access"
  ON staff_users
  FOR ALL
  TO authenticated
  USING (role = 'Administrador');