/*
  # Fix notifications RLS policies

  Previously had 6 incoherent policies including:
  - Anonymous INSERT with `true` (anyone could inject notifications)
  - Duplicate SELECT policies for public role
  - Redundant service_role INSERT (service_role already bypasses RLS)

  1. Policies removed
    - `allow_anonymous_insert` (anon INSERT with true - dangerous)
    - `allow_authenticated_insert` (students could insert notifications)
    - `allow_insert_for_service_role` (redundant, service_role bypasses RLS)
    - `Allow anon role to view all notifications` (anon sees everything)
    - `Allow anon users to view their own notifications` (public role, confusing)
    - `Allow users to view their own notifications` (public role, replaced)

  2. New policies
    - Staff can view all notifications (needed for Admin Web order management)
    - Students can view their own notifications (user_uuid = auth.uid())
    - Students can update their own notifications (mark as read)

  3. Security impact
    - Edge Function `send-notification` uses service_role and bypasses RLS
    - No INSERT policy needed for authenticated/anon users
    - Students only see their own notifications
    - Staff can see all notifications for order management
*/

DROP POLICY IF EXISTS "allow_anonymous_insert" ON notifications;
DROP POLICY IF EXISTS "allow_authenticated_insert" ON notifications;
DROP POLICY IF EXISTS "allow_insert_for_service_role" ON notifications;
DROP POLICY IF EXISTS "Allow anon role to view all notifications" ON notifications;
DROP POLICY IF EXISTS "Allow anon users to view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Allow users to view their own notifications" ON notifications;

CREATE POLICY "Staff can view all notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
        AND staff_users.active = true
    )
  );

CREATE POLICY "Students can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_uuid = auth.uid());

CREATE POLICY "Students can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_uuid = auth.uid())
  WITH CHECK (user_uuid = auth.uid());
