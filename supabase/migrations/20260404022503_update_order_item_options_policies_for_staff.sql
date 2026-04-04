/*
  # Update order_item_options policies to include staff access

  1. Problem
    - Current policies only allow access to order owners (user_uuid = auth.uid())
    - Administrators and Operators also need access to view/manage order item options
    - This matches the pattern used in orders and order_details tables

  2. Changes
    - Drop existing restrictive policies
    - Recreate policies that allow:
      - Administrators: full access (select, insert, update, delete)
      - Operators: read access
      - Order owners (students): read access to their own orders

  3. Security
    - Access is restricted to authenticated users
    - Administrators verified via staff_users table with role = 'Administrador'
    - Operators verified via staff_users table with role = 'Operador'
    - Students can only see options for their own orders
*/

DROP POLICY IF EXISTS "Authenticated users can read order item options" ON order_item_options;
DROP POLICY IF EXISTS "Authenticated users can insert order item options" ON order_item_options;
DROP POLICY IF EXISTS "Authenticated users can update order item options" ON order_item_options;
DROP POLICY IF EXISTS "Authenticated users can delete order item options" ON order_item_options;

CREATE POLICY "Administrators have full access to order item options"
  ON order_item_options
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
        AND staff_users.role = 'Administrador'
        AND staff_users.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
        AND staff_users.role = 'Administrador'
        AND staff_users.active = true
    )
  );

CREATE POLICY "Operators can view order item options"
  ON order_item_options
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
        AND staff_users.role = 'Operador'
        AND staff_users.active = true
    )
  );

CREATE POLICY "Students can view their own order item options"
  ON order_item_options
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM order_details od
      JOIN orders o ON o.id = od.order_id
      WHERE od.id = order_item_options.order_detail_id
        AND o.user_uuid = auth.uid()
    )
  );
