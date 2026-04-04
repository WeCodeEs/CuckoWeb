/*
  # Fix option library RLS policies (4 tables)

  Previously, all 4 option tables allowed INSERT/UPDATE/DELETE for ANY
  authenticated user (condition: auth.uid() IS NOT NULL). This meant
  students could modify option groups, options, prices, and product
  associations.

  1. Tables affected
    - `option_groups`
    - `options`
    - `product_option_groups`
    - `product_option_group_options`

  2. Changes per table
    - DROP all 4 existing policies (read/insert/update/delete with auth.uid() IS NOT NULL)
    - CREATE SELECT policy for all authenticated users (catalog needs to be readable)
    - CREATE INSERT policy restricted to active staff (Administrador or Operador)
    - CREATE UPDATE policy restricted to active staff (Administrador or Operador)
    - CREATE DELETE policy restricted to active staff (Administrador or Operador)

  3. Security impact
    - Students can still READ option data (needed for the ordering flow)
    - Only Admin Web staff can CREATE, MODIFY, or DELETE options
    - Edge Functions using service_role are unaffected
*/

-- ============================================================
-- option_groups
-- ============================================================
DROP POLICY IF EXISTS "Auth users can read option_groups" ON option_groups;
DROP POLICY IF EXISTS "Auth users can insert option_groups" ON option_groups;
DROP POLICY IF EXISTS "Auth users can update option_groups" ON option_groups;
DROP POLICY IF EXISTS "Auth users can delete option_groups" ON option_groups;

CREATE POLICY "Authenticated users can read option_groups"
  ON option_groups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert option_groups"
  ON option_groups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
        AND staff_users.role IN ('Administrador', 'Operador')
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

CREATE POLICY "Staff can delete option_groups"
  ON option_groups FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
        AND staff_users.role IN ('Administrador', 'Operador')
        AND staff_users.active = true
    )
  );

-- ============================================================
-- options
-- ============================================================
DROP POLICY IF EXISTS "Auth users can read options" ON options;
DROP POLICY IF EXISTS "Auth users can insert options" ON options;
DROP POLICY IF EXISTS "Auth users can update options" ON options;
DROP POLICY IF EXISTS "Auth users can delete options" ON options;

CREATE POLICY "Authenticated users can read options"
  ON options FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert options"
  ON options FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
        AND staff_users.role IN ('Administrador', 'Operador')
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

CREATE POLICY "Staff can delete options"
  ON options FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
        AND staff_users.role IN ('Administrador', 'Operador')
        AND staff_users.active = true
    )
  );

-- ============================================================
-- product_option_groups
-- ============================================================
DROP POLICY IF EXISTS "Auth users can read product_option_groups" ON product_option_groups;
DROP POLICY IF EXISTS "Auth users can insert product_option_groups" ON product_option_groups;
DROP POLICY IF EXISTS "Auth users can update product_option_groups" ON product_option_groups;
DROP POLICY IF EXISTS "Auth users can delete product_option_groups" ON product_option_groups;

CREATE POLICY "Authenticated users can read product_option_groups"
  ON product_option_groups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert product_option_groups"
  ON product_option_groups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
        AND staff_users.role IN ('Administrador', 'Operador')
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

CREATE POLICY "Staff can delete product_option_groups"
  ON product_option_groups FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
        AND staff_users.role IN ('Administrador', 'Operador')
        AND staff_users.active = true
    )
  );

-- ============================================================
-- product_option_group_options
-- ============================================================
DROP POLICY IF EXISTS "Auth users can read product_option_group_options" ON product_option_group_options;
DROP POLICY IF EXISTS "Auth users can insert product_option_group_options" ON product_option_group_options;
DROP POLICY IF EXISTS "Auth users can update product_option_group_options" ON product_option_group_options;
DROP POLICY IF EXISTS "Auth users can delete product_option_group_options" ON product_option_group_options;

CREATE POLICY "Authenticated users can read product_option_group_options"
  ON product_option_group_options FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert product_option_group_options"
  ON product_option_group_options FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
        AND staff_users.role IN ('Administrador', 'Operador')
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

CREATE POLICY "Staff can delete product_option_group_options"
  ON product_option_group_options FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
        AND staff_users.role IN ('Administrador', 'Operador')
        AND staff_users.active = true
    )
  );
