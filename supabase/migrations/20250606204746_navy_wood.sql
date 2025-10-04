/*
  # Add UPDATE policy for operators on orders table

  1. Changes
    - Add policy allowing operators to update orders
    - Use correct auth.uid() function instead of uid()
    - Maintain security by checking staff role and active status

  2. Security
    - Only active operators can update orders
    - Maintains existing administrator access
    - Proper authentication checks
*/

-- Add UPDATE policy for operators on orders table
CREATE POLICY "Operators can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM staff_users 
      WHERE staff_users.uuid = auth.uid() 
        AND staff_users.role = 'Operador'::staff_role_enum 
        AND staff_users.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM staff_users 
      WHERE staff_users.uuid = auth.uid() 
        AND staff_users.role = 'Operador'::staff_role_enum 
        AND staff_users.active = true
    )
  );