/*
  # Fix RLS Policies for Option Tables
  
  1. Problem
    - Users are getting "permission denied" errors when accessing option_groups and related tables
    - The existing policies may not be applied correctly
  
  2. Solution
    - Drop and recreate RLS policies for option tables
    - Ensure staff users (authenticated) can access all option-related tables
  
  3. Tables Affected
    - option_groups
    - options
    - product_option_groups
    - product_option_group_options
*/

-- Drop existing policies for option_groups
DROP POLICY IF EXISTS "Authenticated users can read option_groups" ON option_groups;
DROP POLICY IF EXISTS "Authenticated users can insert option_groups" ON option_groups;
DROP POLICY IF EXISTS "Authenticated users can update option_groups" ON option_groups;
DROP POLICY IF EXISTS "Authenticated users can delete option_groups" ON option_groups;

-- Drop existing policies for options
DROP POLICY IF EXISTS "Authenticated users can read options" ON options;
DROP POLICY IF EXISTS "Authenticated users can insert options" ON options;
DROP POLICY IF EXISTS "Authenticated users can update options" ON options;
DROP POLICY IF EXISTS "Authenticated users can delete options" ON options;

-- Drop existing policies for product_option_groups
DROP POLICY IF EXISTS "Authenticated users can read product_option_groups" ON product_option_groups;
DROP POLICY IF EXISTS "Authenticated users can insert product_option_groups" ON product_option_groups;
DROP POLICY IF EXISTS "Authenticated users can update product_option_groups" ON product_option_groups;
DROP POLICY IF EXISTS "Authenticated users can delete product_option_groups" ON product_option_groups;

-- Drop existing policies for product_option_group_options
DROP POLICY IF EXISTS "Authenticated users can read product_option_group_options" ON product_option_group_options;
DROP POLICY IF EXISTS "Authenticated users can insert product_option_group_options" ON product_option_group_options;
DROP POLICY IF EXISTS "Authenticated users can update product_option_group_options" ON product_option_group_options;
DROP POLICY IF EXISTS "Authenticated users can delete product_option_group_options" ON product_option_group_options;

-- Recreate policies for option_groups with staff check
CREATE POLICY "Staff can read option_groups"
  ON option_groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
      AND staff_users.active = true
    )
  );

CREATE POLICY "Staff can insert option_groups"
  ON option_groups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
      AND staff_users.active = true
    )
  );

CREATE POLICY "Staff can update option_groups"
  ON option_groups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
      AND staff_users.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
      AND staff_users.active = true
    )
  );

CREATE POLICY "Staff can delete option_groups"
  ON option_groups FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
      AND staff_users.active = true
    )
  );

-- Recreate policies for options with staff check
CREATE POLICY "Staff can read options"
  ON options FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
      AND staff_users.active = true
    )
  );

CREATE POLICY "Staff can insert options"
  ON options FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
      AND staff_users.active = true
    )
  );

CREATE POLICY "Staff can update options"
  ON options FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
      AND staff_users.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
      AND staff_users.active = true
    )
  );

CREATE POLICY "Staff can delete options"
  ON options FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
      AND staff_users.active = true
    )
  );

-- Recreate policies for product_option_groups with staff check
CREATE POLICY "Staff can read product_option_groups"
  ON product_option_groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
      AND staff_users.active = true
    )
  );

CREATE POLICY "Staff can insert product_option_groups"
  ON product_option_groups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
      AND staff_users.active = true
    )
  );

CREATE POLICY "Staff can update product_option_groups"
  ON product_option_groups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
      AND staff_users.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
      AND staff_users.active = true
    )
  );

CREATE POLICY "Staff can delete product_option_groups"
  ON product_option_groups FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
      AND staff_users.active = true
    )
  );

-- Recreate policies for product_option_group_options with staff check
CREATE POLICY "Staff can read product_option_group_options"
  ON product_option_group_options FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
      AND staff_users.active = true
    )
  );

CREATE POLICY "Staff can insert product_option_group_options"
  ON product_option_group_options FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
      AND staff_users.active = true
    )
  );

CREATE POLICY "Staff can update product_option_group_options"
  ON product_option_group_options FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
      AND staff_users.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
      AND staff_users.active = true
    )
  );

CREATE POLICY "Staff can delete product_option_group_options"
  ON product_option_group_options FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
      AND staff_users.active = true
    )
  );
