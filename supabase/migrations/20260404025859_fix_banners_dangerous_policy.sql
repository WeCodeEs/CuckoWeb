/*
  # Fix banners dangerous ALL policy

  The policy `banners_select_public` was misleadingly named but used
  command ALL with USING(true), granting full INSERT/UPDATE/DELETE
  access to anonymous and authenticated users.

  1. Policy removed
    - `banners_select_public` (ALL with true for anon+authenticated)

  2. New policies
    - Public read-only SELECT for everyone (students and anonymous)
    - Operator management (INSERT/UPDATE/DELETE) for staff

  3. Policy kept
    - `banners_admin_all` (Admin full access - already correct)

  4. Security impact
    - Anonymous and student users can only READ banners
    - Operators can manage banners alongside Administrators
    - The Admin Web bannersStore uses the manage-banners Edge Function,
      but direct queries also need proper policies
*/

DROP POLICY IF EXISTS "banners_select_public" ON banners;

CREATE POLICY "Public can read banners"
  ON banners FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Operators can insert banners"
  ON banners FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
        AND staff_users.role IN ('Administrador', 'Operador')
        AND staff_users.active = true
    )
  );

CREATE POLICY "Operators can update banners"
  ON banners FOR UPDATE
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

CREATE POLICY "Operators can delete banners"
  ON banners FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
        AND staff_users.role IN ('Administrador', 'Operador')
        AND staff_users.active = true
    )
  );
