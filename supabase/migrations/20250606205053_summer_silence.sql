/*
  # Fix operator permissions for CRUD operations

  1. New Policies
    - Allow operators to insert, update, and delete menus
    - Allow operators to insert, update, and delete categories  
    - Allow operators to insert, update, and delete products
    - Allow operators to insert, update, and delete variant options
    - Allow operators to insert, update, and delete ingredient options

  2. Security
    - Policies check for both Administrador and Operador roles
    - All policies verify the user is active in staff_users table
*/

-- Menus table policies for operators
CREATE POLICY "Operators can insert menus"
  ON menus
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users 
      WHERE staff_users.uuid = auth.uid() 
      AND staff_users.role IN ('Administrador', 'Operador') 
      AND staff_users.active = true
    )
  );

CREATE POLICY "Operators can update menus"
  ON menus
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users 
      WHERE staff_users.uuid = auth.uid() 
      AND staff_users.role IN ('Administrador', 'Operador') 
      AND staff_users.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users 
      WHERE staff_users.uuid = auth.uid() 
      AND staff_users.role IN ('Administrador', 'Operador') 
      AND staff_users.active = true
    )
  );

CREATE POLICY "Operators can delete menus"
  ON menus
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users 
      WHERE staff_users.uuid = auth.uid() 
      AND staff_users.role IN ('Administrador', 'Operador') 
      AND staff_users.active = true
    )
  );

-- Categories table policies for operators
CREATE POLICY "Operators can insert categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users 
      WHERE staff_users.uuid = auth.uid() 
      AND staff_users.role IN ('Administrador', 'Operador') 
      AND staff_users.active = true
    )
  );

CREATE POLICY "Operators can update categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users 
      WHERE staff_users.uuid = auth.uid() 
      AND staff_users.role IN ('Administrador', 'Operador') 
      AND staff_users.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users 
      WHERE staff_users.uuid = auth.uid() 
      AND staff_users.role IN ('Administrador', 'Operador') 
      AND staff_users.active = true
    )
  );

CREATE POLICY "Operators can delete categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users 
      WHERE staff_users.uuid = auth.uid() 
      AND staff_users.role IN ('Administrador', 'Operador') 
      AND staff_users.active = true
    )
  );

-- Products table policies for operators
CREATE POLICY "Operators can insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users 
      WHERE staff_users.uuid = auth.uid() 
      AND staff_users.role IN ('Administrador', 'Operador') 
      AND staff_users.active = true
    )
  );

CREATE POLICY "Operators can update products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users 
      WHERE staff_users.uuid = auth.uid() 
      AND staff_users.role IN ('Administrador', 'Operador') 
      AND staff_users.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users 
      WHERE staff_users.uuid = auth.uid() 
      AND staff_users.role IN ('Administrador', 'Operador') 
      AND staff_users.active = true
    )
  );

CREATE POLICY "Operators can delete products"
  ON products
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users 
      WHERE staff_users.uuid = auth.uid() 
      AND staff_users.role IN ('Administrador', 'Operador') 
      AND staff_users.active = true
    )
  );

-- Variant options table policies for operators
CREATE POLICY "Operators can insert variant options"
  ON variant_options
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users 
      WHERE staff_users.uuid = auth.uid() 
      AND staff_users.role IN ('Administrador', 'Operador') 
      AND staff_users.active = true
    )
  );

CREATE POLICY "Operators can delete variant options"
  ON variant_options
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users 
      WHERE staff_users.uuid = auth.uid() 
      AND staff_users.role IN ('Administrador', 'Operador') 
      AND staff_users.active = true
    )
  );

-- Ingredient options table policies for operators
CREATE POLICY "Operators can insert ingredient options"
  ON ingredient_options
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users 
      WHERE staff_users.uuid = auth.uid() 
      AND staff_users.role IN ('Administrador', 'Operador') 
      AND staff_users.active = true
    )
  );

CREATE POLICY "Operators can delete ingredient options"
  ON ingredient_options
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users 
      WHERE staff_users.uuid = auth.uid() 
      AND staff_users.role IN ('Administrador', 'Operador') 
      AND staff_users.active = true
    )
  );