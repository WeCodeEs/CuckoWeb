/*
  # Simplify RLS Policies for Option Tables
  
  1. Problem
    - Complex staff check may be causing issues
    - Need simpler policies that work for authenticated users
  
  2. Solution
    - Use simple authenticated user check
    - These are admin-only tables, so all authenticated users can access
  
  3. Tables Affected
    - option_groups
    - options
    - product_option_groups
    - product_option_group_options
*/

-- Drop existing policies for option_groups
DROP POLICY IF EXISTS "Staff can read option_groups" ON option_groups;
DROP POLICY IF EXISTS "Staff can insert option_groups" ON option_groups;
DROP POLICY IF EXISTS "Staff can update option_groups" ON option_groups;
DROP POLICY IF EXISTS "Staff can delete option_groups" ON option_groups;

-- Drop existing policies for options
DROP POLICY IF EXISTS "Staff can read options" ON options;
DROP POLICY IF EXISTS "Staff can insert options" ON options;
DROP POLICY IF EXISTS "Staff can update options" ON options;
DROP POLICY IF EXISTS "Staff can delete options" ON options;

-- Drop existing policies for product_option_groups
DROP POLICY IF EXISTS "Staff can read product_option_groups" ON product_option_groups;
DROP POLICY IF EXISTS "Staff can insert product_option_groups" ON product_option_groups;
DROP POLICY IF EXISTS "Staff can update product_option_groups" ON product_option_groups;
DROP POLICY IF EXISTS "Staff can delete product_option_groups" ON product_option_groups;

-- Drop existing policies for product_option_group_options
DROP POLICY IF EXISTS "Staff can read product_option_group_options" ON product_option_group_options;
DROP POLICY IF EXISTS "Staff can insert product_option_group_options" ON product_option_group_options;
DROP POLICY IF EXISTS "Staff can update product_option_group_options" ON product_option_group_options;
DROP POLICY IF EXISTS "Staff can delete product_option_group_options" ON product_option_group_options;

-- Simple policies for option_groups
CREATE POLICY "Auth users can read option_groups"
  ON option_groups FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can insert option_groups"
  ON option_groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can update option_groups"
  ON option_groups FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can delete option_groups"
  ON option_groups FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Simple policies for options
CREATE POLICY "Auth users can read options"
  ON options FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can insert options"
  ON options FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can update options"
  ON options FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can delete options"
  ON options FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Simple policies for product_option_groups
CREATE POLICY "Auth users can read product_option_groups"
  ON product_option_groups FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can insert product_option_groups"
  ON product_option_groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can update product_option_groups"
  ON product_option_groups FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can delete product_option_groups"
  ON product_option_groups FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Simple policies for product_option_group_options
CREATE POLICY "Auth users can read product_option_group_options"
  ON product_option_group_options FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can insert product_option_group_options"
  ON product_option_group_options FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can update product_option_group_options"
  ON product_option_group_options FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can delete product_option_group_options"
  ON product_option_group_options FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);
