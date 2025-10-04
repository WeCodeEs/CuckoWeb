/*
  # Add RLS policies for products table

  1. Security Changes
    - Enable RLS on products table (already enabled)
    - Add policy for administrators to have full access
    - Add policy for operators to view all products
    - Add policy for authenticated users to view active products

  2. Notes
    - Administrators can perform all operations (CRUD)
    - Operators can only view products
    - Regular authenticated users can only view active products
*/

-- Policy for administrators (full access)
CREATE POLICY "Administrators have full access to products"
ON products
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

-- Policy for operators (view only)
CREATE POLICY "Operators can view all products"
ON products
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

-- Policy for authenticated users (view active products only)
CREATE POLICY "Authenticated users can view active products"
ON products
FOR SELECT
TO authenticated
USING (active = true);