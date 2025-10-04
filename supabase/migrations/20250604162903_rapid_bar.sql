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

-- Create multiple test orders with different statuses
INSERT INTO orders (id, user_uuid, status, total, notes, created_at)
VALUES 
  (1, '00000000-0000-0000-0000-000000000001', 'Pagado', 75.00, 'Sin azúcar por favor', NOW() - interval '30 minutes'),
  (2, '00000000-0000-0000-0000-000000000001', 'EnPreparacion', 120.50, 'Extra caliente', NOW() - interval '20 minutes'),
  (3, '00000000-0000-0000-0000-000000000001', 'Listo', 45.00, NULL, NOW() - interval '10 minutes'),
  (4, '00000000-0000-0000-0000-000000000001', 'Entregado', 95.50, 'Sin crema', NOW() - interval '5 minutes')
ON CONFLICT (id) DO NOTHING;

-- Add order details for each order
INSERT INTO order_details (order_id, product_id, quantity, unit_price, subtotal, notes)
SELECT 
  o.id,
  p.id,
  CASE 
    WHEN o.id = 1 THEN 2
    WHEN o.id = 2 THEN 3
    WHEN o.id = 3 THEN 1
    ELSE 2
  END as quantity,
  p.base_price,
  p.base_price * CASE 
    WHEN o.id = 1 THEN 2
    WHEN o.id = 2 THEN 3
    WHEN o.id = 3 THEN 1
    ELSE 2
  END as subtotal,
  CASE 
    WHEN o.id = 1 THEN 'Extra caliente'
    WHEN o.id = 2 THEN 'Con leche de almendra'
    WHEN o.id = 3 THEN 'Sin azúcar'
    ELSE 'Normal'
  END as notes
FROM orders o
CROSS JOIN (
  SELECT id, base_price 
  FROM products 
  WHERE name ILIKE '%café%'
  LIMIT 1
) p;

-- Create notifications for each order
INSERT INTO notifications (
  order_id,
  user_uuid,
  type,
  title,
  message,
  created_at
)
SELECT 
  id,
  '00000000-0000-0000-0000-000000000001',
  CASE 
    WHEN status = 'Pagado' THEN 'NotificacionGeneral'::notification_type_enum
    WHEN status = 'EnPreparacion' THEN 'PedidoEnPreparacion'::notification_type_enum
    WHEN status = 'Listo' THEN 'PedidoListo'::notification_type_enum
    ELSE 'NotificacionGeneral'::notification_type_enum
  END,
  CASE 
    WHEN status = 'Pagado' THEN 'Pedido recibido'
    WHEN status = 'EnPreparacion' THEN 'Tu pedido está en preparación'
    WHEN status = 'Listo' THEN 'Tu pedido está listo'
    ELSE 'Pedido entregado'
  END,
  'Tu pedido #' || id || ' ha sido ' || status,
  created_at
FROM orders;