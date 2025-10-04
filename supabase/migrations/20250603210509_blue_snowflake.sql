/*
  # Add RLS policies for categories table

  1. Security Changes
    - Enable RLS on categories table (if not already enabled)
    - Add policy for authenticated users to view all categories
    - Add policy for administrators to have full access to categories
    - Add policy for operators to view all categories
*/

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policy for administrators to have full access
CREATE POLICY "Administrators have full access to categories"
ON categories
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

-- Policy for operators to view all categories
CREATE POLICY "Operators can view all categories"
ON categories
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

-- Policy for authenticated users to view active categories
CREATE POLICY "Authenticated users can view active categories"
ON categories
FOR SELECT
TO authenticated
USING (active = true);