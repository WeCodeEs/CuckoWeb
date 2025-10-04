/*
  # Fix product_variants RLS policies

  1. Security
    - Add RLS policies for product_variants table
    - Allow administrators full access to product variants
    - Allow operators to manage product variants
    - Allow authenticated users to view active product variants

  2. Changes
    - CREATE POLICY for administrators (full access)
    - CREATE POLICY for operators (insert, update, delete)
    - CREATE POLICY for authenticated users (select active variants)
*/

-- Administrators have full access to product variants
CREATE POLICY "Administrators have full access to product variants"
  ON product_variants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
      AND staff_users.role = 'Administrador'::staff_role_enum
      AND staff_users.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
      AND staff_users.role = 'Administrador'::staff_role_enum
      AND staff_users.active = true
    )
  );

-- Operators can manage product variants
CREATE POLICY "Operators can insert product variants"
  ON product_variants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
      AND staff_users.role = ANY(ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])
      AND staff_users.active = true
    )
  );

CREATE POLICY "Operators can update product variants"
  ON product_variants
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
      AND staff_users.role = ANY(ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])
      AND staff_users.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
      AND staff_users.role = ANY(ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])
      AND staff_users.active = true
    )
  );

CREATE POLICY "Operators can delete product variants"
  ON product_variants
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
      AND staff_users.role = ANY(ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])
      AND staff_users.active = true
    )
  );

-- Authenticated users can view active product variants
CREATE POLICY "Authenticated users can view active product variants"
  ON product_variants
  FOR SELECT
  TO authenticated
  USING (active = true);

-- Operators can view all product variants
CREATE POLICY "Operators can view all product variants"
  ON product_variants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
      AND staff_users.role = ANY(ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])
      AND staff_users.active = true
    )
  );