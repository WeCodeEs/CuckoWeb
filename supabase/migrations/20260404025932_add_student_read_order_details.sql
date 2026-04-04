/*
  # Add student read policy on order_details

  Students already have SELECT on `orders` (filtered by user_uuid = auth.uid())
  and SELECT on `order_item_options` (via JOIN through order_details -> orders).
  But `order_details` itself had no student policy, so students could not see
  the items in their own orders.

  1. New policy
    - Students can SELECT order_details for orders they own (via JOIN to orders)

  2. Security impact
    - Students can only see details of their own orders
    - Existing Admin ALL and Operator SELECT policies remain unchanged
*/

CREATE POLICY "Students can view their own order details"
  ON order_details FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_details.order_id
        AND orders.user_uuid = auth.uid()
    )
  );
