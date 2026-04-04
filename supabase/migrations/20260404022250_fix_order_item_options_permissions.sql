/*
  # Fix order_item_options table permissions and security

  1. Problem
    - The order_item_options table has no GRANT permissions for authenticated users
    - RLS is not enabled on the table
    - No RLS policies exist, causing "permission denied" errors

  2. Changes
    - Grant SELECT, INSERT, UPDATE, DELETE to authenticated role
    - Enable RLS on the table
    - Add policies for authenticated users to manage order item options
      through the order ownership chain (order_item_options -> order_details -> orders)

  3. Security
    - Only authenticated users can access the table
    - Users can only access options belonging to their own orders
*/

GRANT SELECT, INSERT, UPDATE, DELETE ON order_item_options TO authenticated;

ALTER TABLE order_item_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read order item options"
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

CREATE POLICY "Authenticated users can insert order item options"
  ON order_item_options
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM order_details od
      JOIN orders o ON o.id = od.order_id
      WHERE od.id = order_item_options.order_detail_id
        AND o.user_uuid = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can update order item options"
  ON order_item_options
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM order_details od
      JOIN orders o ON o.id = od.order_id
      WHERE od.id = order_item_options.order_detail_id
        AND o.user_uuid = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM order_details od
      JOIN orders o ON o.id = od.order_id
      WHERE od.id = order_item_options.order_detail_id
        AND o.user_uuid = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can delete order item options"
  ON order_item_options
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM order_details od
      JOIN orders o ON o.id = od.order_id
      WHERE od.id = order_item_options.order_detail_id
        AND o.user_uuid = auth.uid()
    )
  );
