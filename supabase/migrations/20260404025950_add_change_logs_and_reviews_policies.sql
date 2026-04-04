/*
  # Add policies for change_logs and reviews

  Both tables have RLS enabled but ZERO policies, making them
  completely inaccessible to everyone (including staff).

  1. change_logs
    - Audit table with columns: staff_uuid, table_name, record_id, action, details, change_timestamp
    - SELECT for Administrators only (audit trail is sensitive)
    - INSERT for active staff (so the Admin Web can log changes)
    - No UPDATE or DELETE (audit logs should be immutable)

  2. reviews
    - Student reviews with columns: user_uuid, product_id, rating, comment, created_at
    - SELECT for everyone authenticated (reviews are public within the app)
    - INSERT for students (user_uuid must match auth.uid())
    - UPDATE for students on their own reviews
    - DELETE for Administrators (moderation)

  3. Security impact
    - change_logs: Only admins can read, staff can write, no one can modify/delete
    - reviews: Students manage their own, admins can moderate
*/

-- ============================================================
-- change_logs
-- ============================================================
CREATE POLICY "Administrators can view change logs"
  ON change_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
        AND staff_users.role = 'Administrador'
        AND staff_users.active = true
    )
  );

CREATE POLICY "Staff can insert change logs"
  ON change_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
        AND staff_users.active = true
    )
  );

-- ============================================================
-- reviews
-- ============================================================
CREATE POLICY "Authenticated users can read reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can insert their own reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (user_uuid = auth.uid());

CREATE POLICY "Students can update their own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (user_uuid = auth.uid())
  WITH CHECK (user_uuid = auth.uid());

CREATE POLICY "Administrators can delete reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
        AND staff_users.role = 'Administrador'
        AND staff_users.active = true
    )
  );
