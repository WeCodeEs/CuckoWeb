/*
  # Update orders table and create new test data

  1. Changes
    - Remove notes column from orders table
    - Delete existing test orders
    - Create new test orders with proper order details
    - Add user names instead of faculty display

  2. Security
    - Maintain existing RLS policies
    - Keep proper relationships intact
*/

-- Remove notes column from orders table
ALTER TABLE orders DROP COLUMN IF EXISTS notes;

-- Delete existing test orders and related data
DELETE FROM order_details WHERE order_id IN (1, 2, 3, 4);
DELETE FROM notifications WHERE order_id IN (1, 2, 3, 4);
DELETE FROM orders WHERE id IN (1, 2, 3, 4);

-- Reset the sequence for orders
SELECT setval('orders_id_seq', 1, false);

-- Create new test orders with different statuses
INSERT INTO orders (user_uuid, status, total, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Pagado', 85.00, NOW() - interval '25 minutes'),
  ('00000000-0000-0000-0000-000000000001', 'EnPreparacion', 120.50, NOW() - interval '15 minutes'),
  ('00000000-0000-0000-0000-000000000001', 'Listo', 65.00, NOW() - interval '8 minutes'),
  ('00000000-0000-0000-0000-000000000001', 'Entregado', 95.50, NOW() - interval '3 minutes');

-- Get the actual order IDs that were created
DO $$
DECLARE
    order_ids integer[];
    product_id integer;
BEGIN
    -- Get the order IDs
    SELECT array_agg(id ORDER BY id) INTO order_ids FROM orders WHERE user_uuid = '00000000-0000-0000-0000-000000000001';
    
    -- Get a product ID (create one if none exists)
    SELECT id INTO product_id FROM products LIMIT 1;
    
    IF product_id IS NULL THEN
        -- Create a test product if none exists
        INSERT INTO products (name, description, base_price, active, category_id)
        VALUES ('Café Americano', 'Café negro tradicional', 25.00, true, NULL)
        RETURNING id INTO product_id;
    END IF;
    
    -- Add order details for each order
    INSERT INTO order_details (order_id, product_id, quantity, unit_price, subtotal) VALUES
        (order_ids[1], product_id, 2, 25.00, 50.00),
        (order_ids[1], product_id, 1, 35.00, 35.00),
        (order_ids[2], product_id, 3, 25.00, 75.00),
        (order_ids[2], product_id, 2, 22.75, 45.50),
        (order_ids[3], product_id, 1, 30.00, 30.00),
        (order_ids[3], product_id, 1, 35.00, 35.00),
        (order_ids[4], product_id, 2, 25.00, 50.00),
        (order_ids[4], product_id, 1, 45.50, 45.50);
        
    -- Create notifications for the orders
    INSERT INTO notifications (order_id, user_uuid, type, title, message, created_at) VALUES
        (order_ids[1], '00000000-0000-0000-0000-000000000001', 'NotificacionGeneral', 'Pedido recibido', 'Tu pedido ha sido recibido y está siendo procesado', NOW() - interval '25 minutes'),
        (order_ids[2], '00000000-0000-0000-0000-000000000001', 'PedidoEnPreparacion', 'Pedido en preparación', 'Tu pedido está siendo preparado por nuestro equipo', NOW() - interval '15 minutes'),
        (order_ids[3], '00000000-0000-0000-0000-000000000001', 'PedidoListo', 'Pedido listo', 'Tu pedido está listo para recoger', NOW() - interval '8 minutes'),
        (order_ids[4], '00000000-0000-0000-0000-000000000001', 'NotificacionGeneral', 'Pedido entregado', 'Tu pedido ha sido entregado exitosamente', NOW() - interval '3 minutes');
END $$;