/*
  # Add RLS policies for ingredient_options table

  1. Security Changes
    - Enable RLS on ingredient_options table
    - Add policies for staff users (Administrador and Operador roles):
      - Full access for Administrators
      - Read and update access for Operators
      - Read-only access for authenticated users (active ingredients only)

  2. Notes
    - Administrators have complete CRUD access
    - Operators can view all ingredients and update their status
    - Regular authenticated users can only view active ingredients
*/

-- Enable RLS
ALTER TABLE ingredient_options ENABLE ROW LEVEL SECURITY;

-- Policy for administrators (full access)
CREATE POLICY "Administrators have full access to ingredient options"
ON ingredient_options
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

-- Policy for operators (read and update access)
CREATE POLICY "Operators can view all ingredient options"
ON ingredient_options
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

CREATE POLICY "Operators can update ingredient options"
ON ingredient_options
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM staff_users
    WHERE staff_users.uuid = auth.uid()
    AND staff_users.role = 'Operador'
    AND staff_users.active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staff_users
    WHERE staff_users.uuid = auth.uid()
    AND staff_users.role = 'Operador'
    AND staff_users.active = true
  )
);

-- Policy for authenticated users (read-only access to active ingredients)
CREATE POLICY "Authenticated users can view active ingredient options"
ON ingredient_options
FOR SELECT
TO authenticated
USING (active = true);