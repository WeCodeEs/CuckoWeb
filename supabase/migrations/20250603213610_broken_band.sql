/*
  # Create Test Order Data

  1. Changes
    - Create test auth user
    - Create test faculty
    - Create test user record
    - Create test order with details
    - Add test notification
*/

-- First create the auth user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'juan.perez@test.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Create a test faculty
INSERT INTO faculties (id, name)
VALUES (1, 'Facultad de Ingeniería')
ON CONFLICT (id) DO NOTHING;

-- Create a test user
INSERT INTO users (uuid, first_name, last_name, email, faculty_id)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Juan',
  'Pérez',
  'juan.perez@test.com',
  1
) ON CONFLICT (uuid) DO NOTHING;

-- Create a test order
INSERT INTO orders (id, user_uuid, status, total, notes, created_at)
VALUES (
  1,
  '00000000-0000-0000-0000-000000000001',
  'Pagado',
  75.00,
  'Sin azúcar por favor',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Add order details
INSERT INTO order_details (order_id, product_id, quantity, unit_price, subtotal, notes)
SELECT 
  1,
  id,
  2,
  base_price,
  base_price * 2,
  'Extra caliente'
FROM products 
WHERE name ILIKE '%café%'
LIMIT 1;

-- Create a notification for the order
INSERT INTO notifications (
  order_id,
  user_uuid,
  type,
  title,
  message,
  created_at
)
VALUES (
  1,
  '00000000-0000-0000-0000-000000000001',
  'PedidoEnPreparacion',
  'Tu pedido está en preparación',
  'Tu pedido #1 está siendo preparado',
  NOW()
);