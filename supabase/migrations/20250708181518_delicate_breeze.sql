-- Clear existing test data first to avoid constraint conflicts
DELETE FROM order_details;
DELETE FROM notifications WHERE order_id IS NOT NULL;
DELETE FROM orders;

-- Reset sequences
SELECT setval('orders_id_seq', 1, false);
SELECT setval('order_details_id_seq', 1, false);

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

-- Add unique constraint to prevent duplicate product+variant combinations per order
ALTER TABLE order_details 
  ADD CONSTRAINT unique_product_variant_per_order 
  UNIQUE (order_id, product_id, variant_option_id);

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

-- Create trigger to enforce order details constraint
DROP TRIGGER IF EXISTS enforce_order_has_details ON order_details;
CREATE TRIGGER enforce_order_has_details
  BEFORE DELETE ON order_details
  FOR EACH ROW
  EXECUTE FUNCTION check_order_has_details();

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

-- Create trigger to validate order details
DROP TRIGGER IF EXISTS validate_order_detail_trigger ON order_details;
CREATE TRIGGER validate_order_detail_trigger
  BEFORE INSERT OR UPDATE ON order_details
  FOR EACH ROW
  EXECUTE FUNCTION validate_order_detail();

-- Generate comprehensive test data
DO $$
DECLARE
  user_uuid uuid := '00000000-0000-0000-0000-000000000001';
  current_order_id integer;
  detail_id integer;
  product_record record;
  variant_record record;
  ingredient_record record;
  selected_variant integer;
  ingredient_count integer;
  base_price numeric;
  variant_price numeric;
  total_price numeric;
  i integer;
  j integer;
  k integer;
  time_offset interval;
  order_status order_status_enum;
  used_combinations text[];
  combination_key text;
  max_attempts integer := 10;
  attempt_count integer;
BEGIN
  -- Order 1: Chilaquiles rojos con tasajo, sin cebolla y sin crema + bebida
  INSERT INTO orders (user_uuid, status, total, created_at, updated_at)
  VALUES (user_uuid, 'Recibido'::order_status_enum, 0, NOW() - interval '5 minutes', NOW() - interval '5 minutes')
  RETURNING id INTO current_order_id;
  
  -- Add chilaquiles with tasajo variant
  SELECT p.id, p.base_price INTO product_record
  FROM products p 
  WHERE p.name ILIKE '%chilaquiles%' AND p.name ILIKE '%rojo%' AND p.active = true 
  LIMIT 1;
  
  IF FOUND THEN
    SELECT vo.id, vo.additional_price INTO selected_variant, variant_price
    FROM variant_options vo
    JOIN product_variants pv ON pv.variant_option_id = vo.id
    WHERE pv.product_id = product_record.id AND vo.name ILIKE '%tasajo%' AND vo.active = true
    LIMIT 1;
    
    IF selected_variant IS NULL THEN
      -- Fallback to any active variant for this product
      SELECT vo.id, vo.additional_price INTO selected_variant, variant_price
      FROM variant_options vo
      JOIN product_variants pv ON pv.variant_option_id = vo.id
      WHERE pv.product_id = product_record.id AND vo.active = true
      LIMIT 1;
    END IF;
    
    total_price := product_record.base_price + COALESCE(variant_price, 0);
    
    INSERT INTO order_details (order_id, product_id, variant_option_id, quantity, unit_price, subtotal)
    VALUES (current_order_id, product_record.id, selected_variant, 1, total_price, total_price)
    RETURNING id INTO detail_id;
    
    -- Add ingredients: sin cebolla, sin crema
    FOR ingredient_record IN 
      SELECT io.id
      FROM ingredient_options io
      JOIN product_customizable_ingredients pci ON pci.ingredient_option_id = io.id
      WHERE pci.product_id = product_record.id 
      AND io.active = true 
      AND (io.name ILIKE '%sin cebolla%' OR io.name ILIKE '%cebolla%' OR io.name ILIKE '%sin crema%' OR io.name ILIKE '%crema%')
    LOOP
      INSERT INTO order_detail_ingredients (order_detail_id, ingredient_option_id)
      VALUES (detail_id, ingredient_record.id);
    END LOOP;
  END IF;
  
  -- Add a beverage (different product to avoid duplicate)
  SELECT p.id, p.base_price INTO product_record
  FROM products p 
  WHERE (p.name ILIKE '%café%' OR p.name ILIKE '%agua%' OR p.name ILIKE '%refresco%' OR p.name ILIKE '%bebida%') 
  AND p.active = true 
  AND NOT EXISTS (
    SELECT 1 FROM order_details od 
    WHERE od.order_id = current_order_id AND od.product_id = p.id
  )
  LIMIT 1;
  
  IF FOUND THEN
    SELECT vo.id, vo.additional_price INTO selected_variant, variant_price
    FROM variant_options vo
    JOIN product_variants pv ON pv.variant_option_id = vo.id
    WHERE pv.product_id = product_record.id AND vo.active = true
    ORDER BY RANDOM()
    LIMIT 1;
    
    total_price := product_record.base_price + COALESCE(variant_price, 0);
    
    INSERT INTO order_details (order_id, product_id, variant_option_id, quantity, unit_price, subtotal)
    VALUES (current_order_id, product_record.id, selected_variant, 1, total_price, total_price);
  END IF;
  
  -- Update order total
  UPDATE orders SET total = (
    SELECT COALESCE(SUM(subtotal), 0) FROM order_details WHERE order_details.order_id = current_order_id
  ) WHERE id = current_order_id;

  -- Order 2: Multiple items with maximum ingredients (En Preparación)
  INSERT INTO orders (user_uuid, status, total, created_at, started_at, updated_at)
  VALUES (user_uuid, 'EnPreparacion'::order_status_enum, 0, NOW() - interval '20 minutes', NOW() - interval '18 minutes', NOW() - interval '18 minutes')
  RETURNING id INTO current_order_id;
  
  -- Add 3 different products with various ingredients
  FOR i IN 1..3 LOOP
    SELECT p.id, p.base_price INTO product_record
    FROM products p 
    WHERE p.active = true 
    AND EXISTS (
      SELECT 1 FROM product_variants pv 
      JOIN variant_options vo ON vo.id = pv.variant_option_id 
      WHERE pv.product_id = p.id AND vo.active = true
    )
    AND NOT EXISTS (
      SELECT 1 FROM order_details od 
      WHERE od.order_id = current_order_id AND od.product_id = p.id
    )
    ORDER BY RANDOM()
    LIMIT 1;
    
    IF FOUND THEN
      SELECT vo.id, vo.additional_price INTO selected_variant, variant_price
      FROM variant_options vo
      JOIN product_variants pv ON pv.variant_option_id = vo.id
      WHERE pv.product_id = product_record.id AND vo.active = true
      ORDER BY RANDOM()
      LIMIT 1;
      
      total_price := product_record.base_price + COALESCE(variant_price, 0);
      
      INSERT INTO order_details (order_id, product_id, variant_option_id, quantity, unit_price, subtotal)
      VALUES (current_order_id, product_record.id, selected_variant, 1, total_price, total_price)
      RETURNING id INTO detail_id;
      
      -- Add random ingredients (0-4 per item)
      ingredient_count := floor(random() * 5)::integer;
      FOR j IN 1..ingredient_count LOOP
        SELECT io.id INTO ingredient_record
        FROM ingredient_options io
        JOIN product_customizable_ingredients pci ON pci.ingredient_option_id = io.id
        WHERE pci.product_id = product_record.id AND io.active = true
        ORDER BY RANDOM()
        LIMIT 1;
        
        IF FOUND THEN
          INSERT INTO order_detail_ingredients (order_detail_id, ingredient_option_id)
          VALUES (detail_id, ingredient_record.id)
          ON CONFLICT DO NOTHING;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  
  UPDATE orders SET total = (
    SELECT COALESCE(SUM(subtotal), 0) FROM order_details WHERE order_details.order_id = current_order_id
  ) WHERE id = current_order_id;

  -- Order 3: Single item order (edge case - Listo)
  INSERT INTO orders (user_uuid, status, total, created_at, started_at, ready_at, updated_at)
  VALUES (user_uuid, 'Listo'::order_status_enum, 0, NOW() - interval '35 minutes', NOW() - interval '33 minutes', NOW() - interval '15 minutes', NOW() - interval '15 minutes')
  RETURNING id INTO current_order_id;
  
  SELECT p.id, p.base_price INTO product_record
  FROM products p 
  WHERE p.active = true 
  AND EXISTS (
    SELECT 1 FROM product_variants pv 
    JOIN variant_options vo ON vo.id = pv.variant_option_id 
    WHERE pv.product_id = p.id AND vo.active = true
  )
  ORDER BY RANDOM()
  LIMIT 1;
  
  IF FOUND THEN
    SELECT vo.id, vo.additional_price INTO selected_variant, variant_price
    FROM variant_options vo
    JOIN product_variants pv ON pv.variant_option_id = vo.id
    WHERE pv.product_id = product_record.id AND vo.active = true
    ORDER BY RANDOM()
    LIMIT 1;
    
    total_price := product_record.base_price + COALESCE(variant_price, 0);
    
    INSERT INTO order_details (order_id, product_id, variant_option_id, quantity, unit_price, subtotal)
    VALUES (current_order_id, product_record.id, selected_variant, 1, total_price, total_price);
  END IF;
  
  UPDATE orders SET total = (
    SELECT COALESCE(SUM(subtotal), 0) FROM order_details WHERE order_details.order_id = current_order_id
  ) WHERE id = current_order_id;

  -- Orders 4-12: Mixed category combinations with realistic variety
  FOR i IN 4..12 LOOP
    time_offset := make_interval(mins => i * 8);
    
    -- Determine order status based on loop index
    order_status := CASE 
      WHEN i % 4 = 0 THEN 'Recibido'::order_status_enum
      WHEN i % 4 = 1 THEN 'EnPreparacion'::order_status_enum
      WHEN i % 4 = 2 THEN 'Listo'::order_status_enum
      ELSE 'Entregado'::order_status_enum
    END;
    
    INSERT INTO orders (user_uuid, status, total, created_at, updated_at)
    VALUES (
      user_uuid, 
      order_status,
      0,
      NOW() - time_offset,
      NOW() - time_offset
    )
    RETURNING id INTO current_order_id;
    
    -- Reset used combinations for this order
    used_combinations := ARRAY[]::text[];
    
    -- Add 2-4 items per order from different categories
    FOR j IN 1..(2 + floor(random() * 3)::integer) LOOP
      attempt_count := 0;
      
      -- Try to find a unique product-variant combination
      LOOP
        attempt_count := attempt_count + 1;
        EXIT WHEN attempt_count > max_attempts;
        
        SELECT p.id, p.base_price INTO product_record
        FROM products p 
        WHERE p.active = true 
        AND EXISTS (
          SELECT 1 FROM product_variants pv 
          JOIN variant_options vo ON vo.id = pv.variant_option_id 
          WHERE pv.product_id = p.id AND vo.active = true
        )
        ORDER BY RANDOM()
        LIMIT 1;
        
        IF FOUND THEN
          SELECT vo.id, vo.additional_price INTO selected_variant, variant_price
          FROM variant_options vo
          JOIN product_variants pv ON pv.variant_option_id = vo.id
          WHERE pv.product_id = product_record.id AND vo.active = true
          ORDER BY RANDOM()
          LIMIT 1;
          
          -- Create combination key
          combination_key := product_record.id || '-' || selected_variant;
          
          -- Check if this combination is already used in this order
          IF NOT (combination_key = ANY(used_combinations)) THEN
            -- Add to used combinations
            used_combinations := array_append(used_combinations, combination_key);
            
            total_price := product_record.base_price + COALESCE(variant_price, 0);
            
            INSERT INTO order_details (order_id, product_id, variant_option_id, quantity, unit_price, subtotal)
            VALUES (current_order_id, product_record.id, selected_variant, 1 + floor(random() * 2)::integer, total_price, total_price * (1 + floor(random() * 2)::integer))
            RETURNING id INTO detail_id;
            
            -- Add 0-3 random ingredients
            ingredient_count := floor(random() * 4)::integer;
            FOR k IN 1..ingredient_count LOOP
              SELECT io.id INTO ingredient_record
              FROM ingredient_options io
              JOIN product_customizable_ingredients pci ON pci.ingredient_option_id = io.id
              WHERE pci.product_id = product_record.id AND io.active = true
              ORDER BY RANDOM()
              LIMIT 1;
              
              IF FOUND THEN
                INSERT INTO order_detail_ingredients (order_detail_id, ingredient_option_id)
                VALUES (detail_id, ingredient_record.id)
                ON CONFLICT DO NOTHING;
              END IF;
            END LOOP;
            
            EXIT; -- Successfully added item, exit the retry loop
          END IF;
        END IF;
      END LOOP;
    END LOOP;
    
    UPDATE orders SET total = (
      SELECT COALESCE(SUM(subtotal), 0) FROM order_details WHERE order_details.order_id = current_order_id
    ) WHERE id = current_order_id;
  END LOOP;

  -- Create notifications for all orders
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
  FROM orders o;

END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_detail_ingredients_order_detail ON order_detail_ingredients(order_detail_id);
CREATE INDEX IF NOT EXISTS idx_order_detail_ingredients_ingredient ON order_detail_ingredients(ingredient_option_id);