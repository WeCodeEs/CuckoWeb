/*
  # Create realistic orders with variety

  1. Changes
    - Delete all existing orders and related data
    - Create new realistic orders using available products, variants, and ingredients
    - Include the specific order: chilaquiles rojos con tasajo, sin cebolla y sin crema
    - Add variety with different combinations

  2. Security
    - Maintain existing RLS policies
    - Keep proper relationships intact
*/

-- Delete existing orders and related data
DELETE FROM order_details;
DELETE FROM notifications WHERE order_id IS NOT NULL;
DELETE FROM orders;

-- Reset the sequence for orders
SELECT setval('orders_id_seq', 1, false);

-- Create realistic orders with different statuses and variety
DO $$
DECLARE
    user_uuid uuid := '00000000-0000-0000-0000-000000000001';
    chilaquiles_id integer;
    cafe_id integer;
    tasajo_variant_id integer;
    sin_cebolla_ingredient_id integer;
    sin_crema_ingredient_id integer;
    order_1_id integer;
    order_2_id integer;
    order_3_id integer;
    order_4_id integer;
    order_5_id integer;
BEGIN
    -- Get product IDs
    SELECT id INTO chilaquiles_id FROM products WHERE name ILIKE '%chilaquiles%' AND name ILIKE '%rojo%' LIMIT 1;
    SELECT id INTO cafe_id FROM products WHERE name ILIKE '%café%' OR name ILIKE '%coffee%' LIMIT 1;
    
    -- Get variant and ingredient IDs
    SELECT id INTO tasajo_variant_id FROM variant_options WHERE name ILIKE '%tasajo%' LIMIT 1;
    SELECT id INTO sin_cebolla_ingredient_id FROM ingredient_options WHERE name ILIKE '%sin cebolla%' OR name ILIKE '%cebolla%' LIMIT 1;
    SELECT id INTO sin_crema_ingredient_id FROM ingredient_options WHERE name ILIKE '%sin crema%' OR name ILIKE '%crema%' LIMIT 1;
    
    -- Create Order 1: Chilaquiles rojos con tasajo, sin cebolla y sin crema (Recibido)
    INSERT INTO orders (user_uuid, status, total, created_at, updated_at)
    VALUES (user_uuid, 'Recibido', 85.00, NOW() - interval '5 minutes', NOW() - interval '5 minutes')
    RETURNING id INTO order_1_id;
    
    -- Add order details for chilaquiles
    IF chilaquiles_id IS NOT NULL THEN
        INSERT INTO order_details (order_id, product_id, variant_option_id, quantity, unit_price, subtotal, notes)
        VALUES (order_1_id, chilaquiles_id, tasajo_variant_id, 1, 75.00, 75.00, 'Sin cebolla, sin crema');
    END IF;
    
    -- Add a drink to the order
    IF cafe_id IS NOT NULL THEN
        INSERT INTO order_details (order_id, product_id, quantity, unit_price, subtotal, notes)
        VALUES (order_1_id, cafe_id, 1, 25.00, 25.00, 'Con azúcar');
    END IF;
    
    -- Create Order 2: Mixed order (En Preparación)
    INSERT INTO orders (user_uuid, status, total, created_at, started_at, updated_at)
    VALUES (user_uuid, 'EnPreparacion', 120.50, NOW() - interval '15 minutes', NOW() - interval '13 minutes', NOW() - interval '13 minutes')
    RETURNING id INTO order_2_id;
    
    -- Add multiple items to order 2
    INSERT INTO order_details (order_id, product_id, quantity, unit_price, subtotal, notes)
    SELECT order_2_id, id, 2, base_price, base_price * 2, 'Extra caliente'
    FROM products WHERE name ILIKE '%café%' LIMIT 1;
    
    INSERT INTO order_details (order_id, product_id, quantity, unit_price, subtotal, notes)
    SELECT order_2_id, id, 1, base_price + 15, base_price + 15, 'Con queso extra'
    FROM products WHERE name ILIKE '%quesadilla%' OR name ILIKE '%taco%' LIMIT 1;
    
    -- Create Order 3: Simple order (Listo)
    INSERT INTO orders (user_uuid, status, total, created_at, started_at, ready_at, updated_at)
    VALUES (user_uuid, 'Listo', 65.00, NOW() - interval '25 minutes', NOW() - interval '23 minutes', NOW() - interval '8 minutes', NOW() - interval '8 minutes')
    RETURNING id INTO order_3_id;
    
    INSERT INTO order_details (order_id, product_id, quantity, unit_price, subtotal, notes)
    SELECT order_3_id, id, 1, base_price, base_price, 'Para llevar'
    FROM products WHERE active = true ORDER BY RANDOM() LIMIT 1;
    
    INSERT INTO order_details (order_id, product_id, quantity, unit_price, subtotal, notes)
    SELECT order_3_id, id, 1, base_price, base_price, 'Sin hielo'
    FROM products WHERE name ILIKE '%agua%' OR name ILIKE '%refresco%' OR name ILIKE '%bebida%' LIMIT 1;
    
    -- Create Order 4: Large order (Entregado)
    INSERT INTO orders (user_uuid, status, total, created_at, started_at, ready_at, delivered_at, updated_at)
    VALUES (user_uuid, 'Entregado', 195.50, NOW() - interval '45 minutes', NOW() - interval '43 minutes', NOW() - interval '25 minutes', NOW() - interval '10 minutes', NOW() - interval '10 minutes')
    RETURNING id INTO order_4_id;
    
    -- Add multiple items to order 4
    INSERT INTO order_details (order_id, product_id, quantity, unit_price, subtotal, notes)
    SELECT order_4_id, id, 3, base_price, base_price * 3, 'Para compartir'
    FROM products WHERE active = true ORDER BY base_price DESC LIMIT 1;
    
    INSERT INTO order_details (order_id, product_id, quantity, unit_price, subtotal, notes)
    SELECT order_4_id, id, 2, base_price + 10, (base_price + 10) * 2, 'Con extra ingredientes'
    FROM products WHERE active = true ORDER BY RANDOM() LIMIT 1;
    
    -- Create Order 5: Recent order (Recibido)
    INSERT INTO orders (user_uuid, status, total, created_at, updated_at)
    VALUES (user_uuid, 'Recibido', 45.00, NOW() - interval '2 minutes', NOW() - interval '2 minutes')
    RETURNING id INTO order_5_id;
    
    INSERT INTO order_details (order_id, product_id, quantity, unit_price, subtotal, notes)
    SELECT order_5_id, id, 1, base_price, base_price, 'Urgente'
    FROM products WHERE active = true ORDER BY RANDOM() LIMIT 1;
    
    -- Create notifications for each order
    INSERT INTO notifications (order_id, user_uuid, type, title, message, created_at) VALUES
        (order_1_id, user_uuid, 'PedidoRecibido', 'Pedido recibido', 'Tu pedido de chilaquiles rojos con tasajo ha sido recibido', NOW() - interval '5 minutes'),
        (order_2_id, user_uuid, 'PedidoEnPreparacion', 'Pedido en preparación', 'Tu pedido está siendo preparado por nuestro equipo', NOW() - interval '13 minutes'),
        (order_3_id, user_uuid, 'PedidoListo', 'Pedido listo', 'Tu pedido está listo para recoger', NOW() - interval '8 minutes'),
        (order_4_id, user_uuid, 'PedidoEntregado', 'Pedido entregado', 'Tu pedido ha sido entregado exitosamente', NOW() - interval '10 minutes'),
        (order_5_id, user_uuid, 'PedidoRecibido', 'Pedido recibido', 'Tu nuevo pedido ha sido recibido', NOW() - interval '2 minutes');
        
    -- Update order totals based on actual order details
    UPDATE orders SET total = (
        SELECT COALESCE(SUM(subtotal), 0)
        FROM order_details 
        WHERE order_details.order_id = orders.id
    );
    
END $$;