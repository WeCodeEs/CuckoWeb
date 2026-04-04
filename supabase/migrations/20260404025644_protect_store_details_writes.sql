/*
  # Protect store_details against unauthorized writes

  RLS was just enabled on store_details but only a SELECT policy exists.
  Without an UPDATE policy, no one (except service_role) can modify settings.
  The Admin Web settingsStore.ts does direct UPDATE calls.

  1. Existing policy kept
    - `Allow read access to store_details` (SELECT for public - students need store hours)

  2. New policy
    - Staff (Administrador or Operador) can UPDATE store_details

  3. Security impact
    - Students and anonymous users cannot modify store settings
    - Only active staff can update settings via the Admin Web
*/

CREATE POLICY "Staff can update store_details"
  ON store_details FOR UPDATE
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
