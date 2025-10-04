/*
  # Fix staff_users policies to prevent recursion

  1. Changes
    - Create a materialized view for admin users
    - Update policies to use the materialized view
    - Add refresh function for the materialized view
*/

-- First create a materialized view to cache admin users
CREATE MATERIALIZED VIEW IF NOT EXISTS admin_users AS
SELECT id
FROM staff_users
WHERE role = 'Administrador';

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_admin_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW admin_users;
  RETURN NULL;
END;
$$;

-- Create trigger to refresh the view when staff_users changes
CREATE TRIGGER refresh_admin_users_trigger
AFTER INSERT OR UPDATE OR DELETE ON staff_users
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_admin_users();

-- Drop existing policies
DROP POLICY IF EXISTS "Staff can view own profile" ON staff_users;
DROP POLICY IF EXISTS "Admins can view all staff" ON staff_users;
DROP POLICY IF EXISTS "Enable staff registration" ON staff_users;
DROP POLICY IF EXISTS "Admins can manage all staff" ON staff_users;

-- Create new policies using the materialized view
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
  USING (auth.uid() IN (SELECT id FROM admin_users));

-- Initial refresh of the materialized view
REFRESH MATERIALIZED VIEW admin_users;