-- First, drop any existing triggers that might interfere
DROP TRIGGER IF EXISTS enforce_order_has_details ON order_details;
DROP TRIGGER IF EXISTS validate_order_detail_trigger ON order_details;

-- Clear existing test data first to avoid constraint conflicts
DELETE FROM order_detail_ingredients WHERE id > 0;
DELETE FROM order_details WHERE id > 0;
DELETE FROM notifications WHERE id > 0;
DELETE FROM orders WHERE id > 0;

-- Reset sequences properly
SELECT setval('orders_id_seq', 1, false);
SELECT setval('order_details_id_seq', 1, false);
SELECT setval('notifications_id_seq', 1, false);

-- Also reset order_detail_ingredients sequence if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'order_detail_ingredients_id_seq') THEN
    PERFORM setval('order_detail_ingredients_id_seq', 1, false);
  END IF;
END $$;

-- Drop notes column from order_details
ALTER TABLE order_details DROP COLUMN IF EXISTS notes;

-- Create order_detail_ingredients junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS order_detail_ingredients (
  id serial PRIMARY KEY,
  order_detail_id integer NOT NULL REFERENCES order_details(id) ON DELETE CASCADE,
  ingredient_option_id integer NOT NULL REFERENCES ingredient_options(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(order_detail_id, ingredient_option_id)
);

-- Enable RLS on new table
ALTER TABLE order_detail_ingredients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Administrators have full access to order detail ingredients" ON order_detail_ingredients;
DROP POLICY IF EXISTS "Operators can view order detail ingredients" ON order_detail_ingredients;

-- Add RLS policies for order_detail_ingredients
CREATE POLICY "Administrators have full access to order detail ingredients"
ON order_detail_ingredients
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

CREATE POLICY "Operators can view order detail ingredients"
ON order_detail_ingredients
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

-- Now that data is cleared, we can safely add NOT NULL constraints
ALTER TABLE order_details 
  ALTER COLUMN product_id SET NOT NULL,
  ALTER COLUMN variant_option_id SET NOT NULL;

-- Drop existing unique constraint if it exists and add the new one
ALTER TABLE order_details DROP CONSTRAINT IF EXISTS unique_product_variant_per_order;
ALTER TABLE order_details 
  ADD CONSTRAINT unique_product_variant_per_order 
  UNIQUE (order_id, product_id, variant_option_id);

-- Create function to validate order details on insert/update
CREATE OR REPLACE FUNCTION validate_order_detail()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_id IS NULL THEN
    RAISE EXCEPTION 'product_id cannot be null';
  END IF;
  
  IF NEW.variant_option_id IS NULL THEN
    RAISE EXCEPTION 'variant_option_id cannot be null';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM product_variants 
    WHERE product_id = NEW.product_id 
    AND variant_option_id = NEW.variant_option_id 
    AND active = true
  ) THEN
    RAISE EXCEPTION 'Invalid product-variant combination or variant is not active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to enforce at least one order detail per order
CREATE OR REPLACE FUNCTION check_order_has_details()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF NOT EXISTS (
      SELECT 1 FROM order_details 
      WHERE order_id = OLD.order_id AND id != OLD.id
    ) THEN
      RAISE EXCEPTION 'Cannot delete last order detail. Orders must have at least one line item.';
    END IF;
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_detail_ingredients_order_detail ON order_detail_ingredients(order_detail_id);
CREATE INDEX IF NOT EXISTS idx_order_detail_ingredients_ingredient ON order_detail_ingredients(ingredient_option_id);

-- Generate test data
DO $$
DECLARE
  user_uuid uuid := '00000000-0000-0000-0000-000000000001';
  current_order_id integer;
  detail_id integer;
  selected_product_id integer;
  selected_variant_id integer;
  selected_base_price numeric;
  selected_variant_price numeric;
  calculated_total_price numeric;
  selected_ingredient_id integer;
  
  -- For fallback/sample data creation
  product_exists boolean;
  variant_exists boolean;
  test_product_id integer;
  test_variant_id1 integer;
  test_variant_id2 integer;
  
  -- Array to store created order IDs for notifications
  created_order_ids integer[] := ARRAY[]::integer[];
BEGIN
  -- Check if we have products and variants
  SELECT EXISTS (SELECT 1 FROM products LIMIT 1) INTO product_exists;
  SELECT EXISTS (SELECT 1 FROM variant_options LIMIT 1) INTO variant_exists;
  
  -- Create test data if needed
  IF NOT product_exists OR NOT variant_exists THEN
    -- Create a test product
    INSERT INTO products (name, description, base_price, active)
    VALUES ('Chilaquiles Rojos', 'Chilaquiles tradicionales rojos', 65.00, true)
    RETURNING id INTO test_product_id;
    
    -- Create test variants
    INSERT INTO variant_options (name, additional_price, active)
    VALUES ('Con Tasajo', 15.00, true)
    RETURNING id INTO test_variant_id1;
    
    INSERT INTO variant_options (name, additional_price, active)
    VALUES ('Con Huevo', 10.00, true)
    RETURNING id INTO test_variant_id2;
    
    -- Create test ingredient
    INSERT INTO ingredient_options (name, extra_price, active)
    VALUES ('Sin Cebolla', 0.00, true)
    RETURNING id INTO selected_ingredient_id;
    
    -- Link product and variants
    INSERT INTO product_variants (product_id, variant_option_id, active)
    VALUES 
      (test_product_id, test_variant_id1, true),
      (test_product_id, test_variant_id2, true);
      
    -- Link product and ingredients
    INSERT INTO product_customizable_ingredients (product_id, ingredient_option_id, active)
    VALUES (test_product_id, selected_ingredient_id, true);
  END IF;

  -- Create Order 1: Same product with different variants (Recibido)
  INSERT INTO orders (user_uuid, status, total, created_at, updated_at)
  VALUES (user_uuid, 'Recibido', 0, NOW() - interval '5 minutes', NOW() - interval '5 minutes')
  RETURNING id INTO current_order_id;
  
  created_order_ids := array_append(created_order_ids, current_order_id);
  
  -- Find a product with multiple variants or use test product
  SELECT p.id, p.base_price INTO selected_product_id, selected_base_price
  FROM products p
  WHERE EXISTS (
    SELECT 1 
    FROM product_variants pv1
    JOIN product_variants pv2 ON pv1.product_id = pv2.product_id AND pv1.variant_option_id != pv2.variant_option_id
    WHERE pv1.product_id = p.id AND pv1.active = true AND pv2.active = true
  )
  LIMIT 1;
  
  -- If no product with multiple variants, use our test product or any product
  IF selected_product_id IS NULL THEN
    IF test_product_id IS NOT NULL THEN
      selected_product_id := test_product_id;
      selected_base_price := 65.00;
    ELSE
      SELECT p.id, p.base_price INTO selected_product_id, selected_base_price 
      FROM products p WHERE p.active = true LIMIT 1;
    END IF;
  END IF;
  
  -- Get first variant for this product
  SELECT vo.id, vo.additional_price INTO selected_variant_id, selected_variant_price
  FROM variant_options vo
  JOIN product_variants pv ON pv.variant_option_id = vo.id
  WHERE pv.product_id = selected_product_id AND pv.active = true AND vo.active = true
  ORDER BY vo.id
  LIMIT 1;
  
  -- Add first variant of product to order
  IF selected_product_id IS NOT NULL AND selected_variant_id IS NOT NULL THEN
    calculated_total_price := selected_base_price + COALESCE(selected_variant_price, 0);
    
    INSERT INTO order_details (order_id, product_id, variant_option_id, quantity, unit_price, subtotal)
    VALUES (current_order_id, selected_product_id, selected_variant_id, 1, calculated_total_price, calculated_total_price)
    RETURNING id INTO detail_id;
    
    -- Add ingredient to first variant
    SELECT io.id INTO selected_ingredient_id
    FROM ingredient_options io
    JOIN product_customizable_ingredients pci ON pci.ingredient_option_id = io.id
    WHERE pci.product_id = selected_product_id AND io.active = true
    LIMIT 1;
    
    IF selected_ingredient_id IS NOT NULL THEN
      INSERT INTO order_detail_ingredients (order_detail_id, ingredient_option_id)
      VALUES (detail_id, selected_ingredient_id);
    END IF;
    
    -- Get a different variant for the same product
    SELECT vo.id, vo.additional_price INTO selected_variant_id, selected_variant_price
    FROM variant_options vo
    JOIN product_variants pv ON pv.variant_option_id = vo.id
    WHERE pv.product_id = selected_product_id 
      AND pv.active = true
      AND vo.active = true
      AND vo.id != (
        SELECT od.variant_option_id FROM order_details od
        WHERE od.order_id = current_order_id AND od.product_id = selected_product_id
        LIMIT 1
      )
    LIMIT 1;
    
    -- Add second variant of same product to order if found
    IF selected_variant_id IS NOT NULL THEN
      calculated_total_price := selected_base_price + COALESCE(selected_variant_price, 0);
      
      INSERT INTO order_details (order_id, product_id, variant_option_id, quantity, unit_price, subtotal)
      VALUES (current_order_id, selected_product_id, selected_variant_id, 1, calculated_total_price, calculated_total_price)
      RETURNING id INTO detail_id;
      
      -- Add different ingredient to second variant
      SELECT io.id INTO selected_ingredient_id
      FROM ingredient_options io
      JOIN product_customizable_ingredients pci ON pci.ingredient_option_id = io.id
      WHERE pci.product_id = selected_product_id 
        AND io.active = true
        AND io.id NOT IN (
          SELECT odi.ingredient_option_id 
          FROM order_detail_ingredients odi
          JOIN order_details od ON od.id = odi.order_detail_id
          WHERE od.order_id = current_order_id
        )
      LIMIT 1;
      
      IF selected_ingredient_id IS NOT NULL THEN
        INSERT INTO order_detail_ingredients (order_detail_id, ingredient_option_id)
        VALUES (detail_id, selected_ingredient_id);
      END IF;
    END IF;
  END IF;
  
  -- Update order total
  UPDATE orders SET total = (
    SELECT COALESCE(SUM(subtotal), 0) FROM order_details WHERE order_details.order_id = current_order_id
  ) WHERE id = current_order_id;
  
  -- Create Order 2: EnPreparacion status
  INSERT INTO orders (user_uuid, status, total, created_at, started_at, updated_at)
  VALUES (user_uuid, 'EnPreparacion', 0, NOW() - interval '20 minutes', NOW() - interval '18 minutes', NOW() - interval '18 minutes')
  RETURNING id INTO current_order_id;
  
  created_order_ids := array_append(created_order_ids, current_order_id);
  
  -- Add different product to this order
  SELECT p.id, p.base_price INTO selected_product_id, selected_base_price
  FROM products p
  WHERE EXISTS (
    SELECT 1 FROM product_variants pv
    WHERE pv.product_id = p.id AND pv.active = true
  )
  AND p.active = true
  ORDER BY RANDOM()
  LIMIT 1;
  
  SELECT vo.id, vo.additional_price INTO selected_variant_id, selected_variant_price
  FROM variant_options vo
  JOIN product_variants pv ON pv.variant_option_id = vo.id
  WHERE pv.product_id = selected_product_id AND pv.active = true AND vo.active = true
  LIMIT 1;
  
  IF selected_product_id IS NOT NULL AND selected_variant_id IS NOT NULL THEN
    calculated_total_price := selected_base_price + COALESCE(selected_variant_price, 0);
    
    INSERT INTO order_details (order_id, product_id, variant_option_id, quantity, unit_price, subtotal)
    VALUES (current_order_id, selected_product_id, selected_variant_id, 2, calculated_total_price, calculated_total_price * 2);
  END IF;
  
  -- Update order total
  UPDATE orders SET total = (
    SELECT COALESCE(SUM(subtotal), 0) FROM order_details WHERE order_details.order_id = current_order_id
  ) WHERE id = current_order_id;
  
  -- Create Order 3: Listo status
  INSERT INTO orders (user_uuid, status, total, created_at, started_at, ready_at, updated_at)
  VALUES (user_uuid, 'Listo', 0, NOW() - interval '35 minutes', NOW() - interval '33 minutes', NOW() - interval '15 minutes', NOW() - interval '15 minutes')
  RETURNING id INTO current_order_id;
  
  created_order_ids := array_append(created_order_ids, current_order_id);
  
  -- Add item to this order
  SELECT p.id, p.base_price INTO selected_product_id, selected_base_price
  FROM products p
  WHERE EXISTS (
    SELECT 1 FROM product_variants pv
    WHERE pv.product_id = p.id AND pv.active = true
  )
  AND p.active = true
  ORDER BY RANDOM()
  LIMIT 1;
  
  SELECT vo.id, vo.additional_price INTO selected_variant_id, selected_variant_price
  FROM variant_options vo
  JOIN product_variants pv ON pv.variant_option_id = vo.id
  WHERE pv.product_id = selected_product_id AND pv.active = true AND vo.active = true
  LIMIT 1;
  
  IF selected_product_id IS NOT NULL AND selected_variant_id IS NOT NULL THEN
    calculated_total_price := selected_base_price + COALESCE(selected_variant_price, 0);
    
    INSERT INTO order_details (order_id, product_id, variant_option_id, quantity, unit_price, subtotal)
    VALUES (current_order_id, selected_product_id, selected_variant_id, 1, calculated_total_price, calculated_total_price);
  END IF;
  
  -- Update order total
  UPDATE orders SET total = (
    SELECT COALESCE(SUM(subtotal), 0) FROM order_details WHERE order_details.order_id = current_order_id
  ) WHERE id = current_order_id;
  
  -- Create Order 4: Entregado status
  INSERT INTO orders (user_uuid, status, total, created_at, started_at, ready_at, delivered_at, updated_at)
  VALUES (user_uuid, 'Entregado', 0, NOW() - interval '45 minutes', NOW() - interval '43 minutes', NOW() - interval '30 minutes', NOW() - interval '20 minutes', NOW() - interval '20 minutes')
  RETURNING id INTO current_order_id;
  
  created_order_ids := array_append(created_order_ids, current_order_id);
  
  -- Add item to this order
  SELECT p.id, p.base_price INTO selected_product_id, selected_base_price
  FROM products p
  WHERE EXISTS (
    SELECT 1 FROM product_variants pv
    WHERE pv.product_id = p.id AND pv.active = true
  )
  AND p.active = true
  ORDER BY RANDOM()
  LIMIT 1;
  
  SELECT vo.id, vo.additional_price INTO selected_variant_id, selected_variant_price
  FROM variant_options vo
  JOIN product_variants pv ON pv.variant_option_id = vo.id
  WHERE pv.product_id = selected_product_id AND pv.active = true AND vo.active = true
  LIMIT 1;
  
  IF selected_product_id IS NOT NULL AND selected_variant_id IS NOT NULL THEN
    calculated_total_price := selected_base_price + COALESCE(selected_variant_price, 0);
    
    INSERT INTO order_details (order_id, product_id, variant_option_id, quantity, unit_price, subtotal)
    VALUES (current_order_id, selected_product_id, selected_variant_id, 1, calculated_total_price, calculated_total_price);
  END IF;
  
  -- Update order total
  UPDATE orders SET total = (
    SELECT COALESCE(SUM(subtotal), 0) FROM order_details WHERE order_details.order_id = current_order_id
  ) WHERE id = current_order_id;

  -- Create notifications for all created orders using individual INSERT statements
  FOR i IN 1..array_length(created_order_ids, 1) LOOP
    INSERT INTO notifications (order_id, user_uuid, type, title, message, created_at)
    SELECT 
      o.id,
      o.user_uuid,
      CASE 
        WHEN o.status = 'Recibido' THEN 'PedidoRecibido'::notification_type_enum
        WHEN o.status = 'EnPreparacion' THEN 'PedidoEnPreparacion'::notification_type_enum
        WHEN o.status = 'Listo' THEN 'PedidoListo'::notification_type_enum
        ELSE 'PedidoEntregado'::notification_type_enum
      END,
      CASE 
        WHEN o.status = 'Recibido' THEN 'Pedido recibido'
        WHEN o.status = 'EnPreparacion' THEN 'Pedido en preparación'
        WHEN o.status = 'Listo' THEN 'Pedido listo'
        ELSE 'Pedido entregado'
      END,
      'Tu pedido #' || o.id || ' está ' || 
      CASE 
        WHEN o.status = 'Recibido' THEN 'recibido y en cola'
        WHEN o.status = 'EnPreparacion' THEN 'siendo preparado'
        WHEN o.status = 'Listo' THEN 'listo para recoger'
        ELSE 'entregado'
      END,
      o.created_at
    FROM orders o
    WHERE o.id = created_order_ids[i];
  END LOOP;
END $$;

-- Now create the triggers after data is populated
CREATE TRIGGER validate_order_detail_trigger
  BEFORE INSERT OR UPDATE ON order_details
  FOR EACH ROW
  EXECUTE FUNCTION validate_order_detail();

CREATE TRIGGER enforce_order_has_details
  BEFORE DELETE ON order_details
  FOR EACH ROW
  EXECUTE FUNCTION check_order_has_details();