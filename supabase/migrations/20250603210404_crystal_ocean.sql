/*
  # Add RLS policies for menus table

  1. Changes
    - Enable RLS on menus table
    - Add policies for:
      - Staff administrators can perform all operations
      - All authenticated users can view active menus
      - Staff operators can view all menus

  2. Security
    - Enable RLS on menus table
    - Add policies for different user roles
    - Ensure proper access control based on staff roles
*/

-- Enable RLS
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;

-- Allow administrators full access
CREATE POLICY "Administrators have full access to menus"
ON menus
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM staff_users 
    WHERE staff_users.uuid = auth.uid() 
    AND staff_users.role = 'Administrador'
    AND staff_users.active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staff_users 
    WHERE staff_users.uuid = auth.uid() 
    AND staff_users.role = 'Administrador'
    AND staff_users.active = true
  )
);

-- Allow operators to view all menus
CREATE POLICY "Operators can view all menus"
ON menus
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM staff_users 
    WHERE staff_users.uuid = auth.uid() 
    AND staff_users.role = 'Operador'
    AND staff_users.active = true
  )
);

-- Allow all authenticated users to view active menus
CREATE POLICY "Authenticated users can view active menus"
ON menus
FOR SELECT
TO authenticated
USING (active = true);