/*
  # Fix RLS policies for menus table

  1. Changes
    - Drop all existing policies to ensure clean state
    - Create single comprehensive policy for staff access
    - Ensure proper authentication checks
*/

-- First, ensure RLS is enabled
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Staff can view menus" ON menus;
DROP POLICY IF EXISTS "Admins can manage menus" ON menus;
DROP POLICY IF EXISTS "Staff can manage menus" ON menus;

-- Create a single comprehensive policy
CREATE POLICY "authenticated_staff_access"
  ON menus
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM staff_users
      WHERE staff_users.id = auth.uid()
      AND staff_users.role IN ('Administrador', 'Operador')
    )
  );