/*
  # Add RLS policies for variant_options table

  1. Changes
    - Enable RLS on variant_options table
    - Add policies for:
      - Administrators: Full access to variant options
      - Operators: Read-only access to variant options
      - Authenticated users: Read-only access to active variant options

  2. Security
    - Enable RLS on variant_options table
    - Add policy for administrators to have full access
    - Add policy for operators to view all variant options
    - Add policy for authenticated users to view active variant options
*/

-- Enable RLS
ALTER TABLE variant_options ENABLE ROW LEVEL SECURITY;

-- Administrators have full access to variant options
CREATE POLICY "Administrators have full access to variant options"
ON variant_options
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

-- Operators can view all variant options
CREATE POLICY "Operators can view all variant options"
ON variant_options
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

-- Authenticated users can view active variant options
CREATE POLICY "Authenticated users can view active variant options"
ON variant_options
FOR SELECT
TO authenticated
USING (active = true);