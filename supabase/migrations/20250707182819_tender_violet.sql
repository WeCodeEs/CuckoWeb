/*
  # Update order status system and remove payments

  1. Changes
    - Remove payment-related tables and enums
    - Update order status enum to new values
    - Update notification type enum
    - Add timestamp columns for order tracking
    - Create triggers for automatic timestamp updates
    - Update test data

  2. Security
    - Maintain existing RLS policies
    - Update functions to work with new enum values
*/

-- Drop payment-related tables and constraints first
DROP TABLE IF EXISTS payments CASCADE;
DROP TYPE IF EXISTS payment_status_enum CASCADE;

-- Add new timestamp columns to orders table first
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS ready_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- Handle the default value issue by temporarily removing it
ALTER TABLE orders ALTER COLUMN status DROP DEFAULT;

-- Create new enum types with new names to avoid conflicts
CREATE TYPE order_status_enum_new AS ENUM ('Recibido', 'EnPreparacion', 'Listo', 'Entregado');
CREATE TYPE notification_type_enum_new AS ENUM (
  'PedidoRecibido',
  'PedidoListo', 
  'PedidoEnPreparacion',
  'PedidoEntregado',
  'NotificacionPersonal',
  'NotificacionGeneral'
);

-- Update orders table to use new enum with proper mapping
ALTER TABLE orders 
  ALTER COLUMN status TYPE order_status_enum_new USING 
    CASE 
      WHEN status::text = 'PendientePago' THEN 'Recibido'::order_status_enum_new
      WHEN status::text = 'Pagado' THEN 'Recibido'::order_status_enum_new
      WHEN status::text = 'EnPreparacion' THEN 'EnPreparacion'::order_status_enum_new
      WHEN status::text = 'Listo' THEN 'Listo'::order_status_enum_new
      WHEN status::text = 'Entregado' THEN 'Entregado'::order_status_enum_new
      WHEN status::text = 'Cancelado' THEN 'Recibido'::order_status_enum_new
      ELSE 'Recibido'::order_status_enum_new
    END;

-- Update notifications table to use new enum with proper mapping
ALTER TABLE notifications 
  ALTER COLUMN type TYPE notification_type_enum_new USING 
    CASE 
      WHEN type::text = 'PedidoListo' THEN 'PedidoListo'::notification_type_enum_new
      WHEN type::text = 'PedidoCancelado' THEN 'NotificacionGeneral'::notification_type_enum_new
      WHEN type::text = 'PedidoEnPreparacion' THEN 'PedidoEnPreparacion'::notification_type_enum_new
      WHEN type::text = 'NotificacionGeneral' THEN 'NotificacionGeneral'::notification_type_enum_new
      ELSE 'NotificacionGeneral'::notification_type_enum_new
    END;

-- Drop old enum types
DROP TYPE order_status_enum CASCADE;
DROP TYPE notification_type_enum CASCADE;

-- Rename new enum types to original names
ALTER TYPE order_status_enum_new RENAME TO order_status_enum;
ALTER TYPE notification_type_enum_new RENAME TO notification_type_enum;

-- Set the new default value for the status column
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'Recibido'::order_status_enum;

-- Update existing orders with realistic timestamps based on current status
UPDATE orders SET 
  started_at = CASE 
    WHEN status IN ('EnPreparacion', 'Listo', 'Entregado') 
    THEN created_at + interval '2 minutes'
    ELSE NULL 
  END,
  ready_at = CASE 
    WHEN status IN ('Listo', 'Entregado') 
    THEN created_at + interval '8 minutes'
    ELSE NULL 
  END,
  delivered_at = CASE 
    WHEN status = 'Entregado' 
    THEN created_at + interval '12 minutes'
    ELSE NULL 
  END;

-- Create function to automatically update timestamps on status change
CREATE OR REPLACE FUNCTION update_order_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Update updated_at on any change
  NEW.updated_at = NOW();
  
  -- Set started_at when status changes to EnPreparacion
  IF OLD.status != 'EnPreparacion' AND NEW.status = 'EnPreparacion' THEN
    NEW.started_at = NOW();
  END IF;
  
  -- Set ready_at when status changes to Listo
  IF OLD.status != 'Listo' AND NEW.status = 'Listo' THEN
    NEW.ready_at = NOW();
  END IF;
  
  -- Set delivered_at when status changes to Entregado
  IF OLD.status != 'Entregado' AND NEW.status = 'Entregado' THEN
    NEW.delivered_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for timestamp updates
DROP TRIGGER IF EXISTS update_order_timestamps_trigger ON orders;
CREATE TRIGGER update_order_timestamps_trigger
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_order_timestamps();

-- Update the log_order_status_change function to use new enum values
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status <> NEW.status THEN
    INSERT INTO change_logs (
      staff_uuid,
      table_name,
      record_id,
      action,
      details,
      change_timestamp
    ) VALUES (
      auth.uid(),
      'orders',
      NEW.id::text,
      'status_change',
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'timestamp', NOW()
      ),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new test orders with the updated schema
DELETE FROM order_details WHERE order_id IN (SELECT id FROM orders);
DELETE FROM notifications WHERE order_id IN (SELECT id FROM orders);
DELETE FROM orders;

-- Reset sequence
SELECT setval('orders_id_seq', 1, false);

-- Create new test orders with proper timestamps
INSERT INTO orders (user_uuid, status, total, created_at, started_at, ready_at, delivered_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Recibido', 85.00, 
   NOW() - interval '25 minutes', NULL, NULL, NULL, NOW() - interval '25 minutes'),
  ('00000000-0000-0000-0000-000000000001', 'EnPreparacion', 120.50, 
   NOW() - interval '20 minutes', NOW() - interval '18 minutes', NULL, NULL, NOW() - interval '18 minutes'),
  ('00000000-0000-0000-0000-000000000001', 'Listo', 65.00, 
   NOW() - interval '15 minutes', NOW() - interval '13 minutes', NOW() - interval '8 minutes', NULL, NOW() - interval '8 minutes'),
  ('00000000-0000-0000-0000-000000000001', 'Entregado', 95.50, 
   NOW() - interval '30 minutes', NOW() - interval '28 minutes', NOW() - interval '20 minutes', NOW() - interval '5 minutes', NOW() - interval '5 minutes');

-- Add order details for the new orders
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
        INSERT INTO products (name, description, base_price, active, category_id)
        VALUES ('Café Americano', 'Café negro tradicional', 25.00, true, NULL)
        RETURNING id INTO product_id;
    END IF;
    
    -- Add order details
    INSERT INTO order_details (order_id, product_id, quantity, unit_price, subtotal) VALUES
        (order_ids[1], product_id, 2, 25.00, 50.00),
        (order_ids[1], product_id, 1, 35.00, 35.00),
        (order_ids[2], product_id, 3, 25.00, 75.00),
        (order_ids[2], product_id, 2, 22.75, 45.50),
        (order_ids[3], product_id, 1, 30.00, 30.00),
        (order_ids[3], product_id, 1, 35.00, 35.00),
        (order_ids[4], product_id, 2, 25.00, 50.00),
        (order_ids[4], product_id, 1, 45.50, 45.50);
        
    -- Create notifications with new enum values
    INSERT INTO notifications (order_id, user_uuid, type, title, message, created_at) VALUES
        (order_ids[1], '00000000-0000-0000-0000-000000000001', 'PedidoRecibido', 'Pedido recibido', 'Tu pedido ha sido recibido y está en cola', NOW() - interval '25 minutes'),
        (order_ids[2], '00000000-0000-0000-0000-000000000001', 'PedidoEnPreparacion', 'Pedido en preparación', 'Tu pedido está siendo preparado', NOW() - interval '18 minutes'),
        (order_ids[3], '00000000-0000-0000-0000-000000000001', 'PedidoListo', 'Pedido listo', 'Tu pedido está listo para recoger', NOW() - interval '8 minutes'),
        (order_ids[4], '00000000-0000-0000-0000-000000000001', 'PedidoEntregado', 'Pedido entregado', 'Tu pedido ha sido entregado', NOW() - interval '5 minutes');
END $$;