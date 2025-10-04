/*
  # Add RLS policies for product_customizable_ingredients table

  1. Security
    - Enable RLS policies for product_customizable_ingredients table
    - Add policy for administrators to have full access
    - Add policy for operators to manage product ingredients
    - Add policy for authenticated users to view active ingredient associations

  2. Changes
    - CREATE POLICY for administrators (full access)
    - CREATE POLICY for operators (insert, update, delete)
    - CREATE POLICY for operators (select all)
    - CREATE POLICY for authenticated users (select active only)
*/

-- Administrators have full access to product customizable ingredients
CREATE POLICY "Administrators have full access to product ingredients"
  ON product_customizable_ingredients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM staff_users
      WHERE staff_users.uuid = auth.uid()
        AND staff_users.role = 'Administrador'::staff_role_enum
        AND staff_users.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM staff_users
      WHERE staff_users.uuid = auth.uid()
        AND staff_users.role = 'Administrador'::staff_role_enum
        AND staff_users.active = true
    )
  );

-- Operators can insert product ingredients
CREATE POLICY "Operators can insert product ingredients"
  ON product_customizable_ingredients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM staff_users
      WHERE staff_users.uuid = auth.uid()
        AND staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])
        AND staff_users.active = true
    )
  );

-- Operators can update product ingredients
CREATE POLICY "Operators can update product ingredients"
  ON product_customizable_ingredients
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM staff_users
      WHERE staff_users.uuid = auth.uid()
        AND staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])
        AND staff_users.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM staff_users
      WHERE staff_users.uuid = auth.uid()
        AND staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])
        AND staff_users.active = true
    )
  );

-- Operators can delete product ingredients
CREATE POLICY "Operators can delete product ingredients"
  ON product_customizable_ingredients
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM staff_users
      WHERE staff_users.uuid = auth.uid()
        AND staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])
        AND staff_users.active = true
    )
  );

-- Operators can view all product ingredients
CREATE POLICY "Operators can view all product ingredients"
  ON product_customizable_ingredients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM staff_users
      WHERE staff_users.uuid = auth.uid()
        AND staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])
        AND staff_users.active = true
    )
  );

-- Authenticated users can view active product ingredients
CREATE POLICY "Authenticated users can view active product ingredients"
  ON product_customizable_ingredients
  FOR SELECT
  TO authenticated
  USING (active = true);