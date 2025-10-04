/*
  # Refactor variants and ingredients to use global options

  1. Changes
    - Create new tables for global options management
    - Set up many-to-many relationships
    - Handle existing data dependencies properly
    - Clean up legacy structures safely

  2. Security
    - Enable RLS on new tables
    - Add policies for staff access
    - Create necessary indexes
*/

-- Create variant_options table
CREATE TABLE IF NOT EXISTS variant_options (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create ingredient_options table
CREATE TABLE IF NOT EXISTS ingredient_options (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create product_variants link table
CREATE TABLE IF NOT EXISTS product_variants (
  product_id integer REFERENCES products(id) ON DELETE CASCADE,
  variant_option_id integer REFERENCES variant_options(id),
  additional_price numeric(10,2) DEFAULT 0 CHECK (additional_price >= 0),
  active boolean DEFAULT true,
  PRIMARY KEY (product_id, variant_option_id)
);

-- Create product_customizable_ingredients link table
CREATE TABLE IF NOT EXISTS product_customizable_ingredients (
  product_id integer REFERENCES products(id) ON DELETE CASCADE,
  ingredient_option_id integer REFERENCES ingredient_options(id),
  active boolean DEFAULT true,
  PRIMARY KEY (product_id, ingredient_option_id)
);

-- First remove the foreign key constraint from order_details
ALTER TABLE order_details 
DROP CONSTRAINT IF EXISTS order_details_variant_id_fkey;

-- Now we can safely drop the variants table
DROP TABLE IF EXISTS variants CASCADE;

-- Clean up products and order_details
ALTER TABLE products DROP COLUMN IF EXISTS customizable_ingredients;
ALTER TABLE order_details 
DROP COLUMN IF EXISTS variant_id,
ADD COLUMN product_variant_id integer,
ADD COLUMN variant_option_id integer,
ADD CONSTRAINT order_details_product_variant_fk 
  FOREIGN KEY (product_id, variant_option_id) 
  REFERENCES product_variants(product_id, variant_option_id);

-- Clean up menus
ALTER TABLE menus DROP COLUMN IF EXISTS status;

-- Enable RLS on new tables
ALTER TABLE variant_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_customizable_ingredients ENABLE ROW LEVEL SECURITY;

-- Create staff access policies for variant_options
CREATE POLICY "staff_access_policy"
  ON variant_options
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM staff_users 
      WHERE staff_users.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM staff_users 
      WHERE staff_users.id = auth.uid()
    )
  );

-- Create staff access policies for ingredient_options
CREATE POLICY "staff_access_policy"
  ON ingredient_options
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM staff_users 
      WHERE staff_users.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM staff_users 
      WHERE staff_users.id = auth.uid()
    )
  );

-- Create staff access policies for product_variants
CREATE POLICY "staff_access_policy"
  ON product_variants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM staff_users 
      WHERE staff_users.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM staff_users 
      WHERE staff_users.id = auth.uid()
    )
  );

-- Create staff access policies for product_customizable_ingredients
CREATE POLICY "staff_access_policy"
  ON product_customizable_ingredients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM staff_users 
      WHERE staff_users.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM staff_users 
      WHERE staff_users.id = auth.uid()
    )
  );

-- Create indexes for foreign keys
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_variant ON product_variants(variant_option_id);
CREATE INDEX idx_product_ingredients_product ON product_customizable_ingredients(product_id);
CREATE INDEX idx_product_ingredients_ingredient ON product_customizable_ingredients(ingredient_option_id);
CREATE INDEX idx_order_details_product_variant ON order_details(product_id, variant_option_id);

-- Insert sample data
INSERT INTO variant_options (name) VALUES ('Tasajo') ON CONFLICT DO NOTHING;
INSERT INTO ingredient_options (name) VALUES ('Tasajo') ON CONFLICT DO NOTHING;