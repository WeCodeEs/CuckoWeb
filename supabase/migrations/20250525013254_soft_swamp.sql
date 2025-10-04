/*
  # Add variant and ingredient options with many-to-many relationships

  1. Changes
    - Create tables for variant and ingredient options
    - Set up many-to-many relationships with products
    - Clean up legacy columns and constraints
    - Add proper indexes and RLS policies

  2. Security
    - Enable RLS on all new tables
    - Add staff access policies
    - Create necessary indexes
*/

-- First check and drop existing tables/columns to avoid conflicts
DROP TABLE IF EXISTS variants CASCADE;
DROP TABLE IF EXISTS variant_options CASCADE;
DROP TABLE IF EXISTS ingredient_options CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS product_customizable_ingredients CASCADE;

-- Remove legacy columns and constraints
ALTER TABLE products DROP COLUMN IF EXISTS customizable_ingredients;
ALTER TABLE order_details DROP CONSTRAINT IF EXISTS order_details_variant_id_fkey;
ALTER TABLE order_details DROP COLUMN IF EXISTS variant_id;
ALTER TABLE menus DROP COLUMN IF EXISTS status;

-- Create variant_options table
CREATE TABLE variant_options (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create ingredient_options table
CREATE TABLE ingredient_options (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create product_variants link table
CREATE TABLE product_variants (
  product_id integer REFERENCES products(id) ON DELETE CASCADE,
  variant_option_id integer REFERENCES variant_options(id),
  additional_price numeric(10,2) DEFAULT 0 CHECK (additional_price >= 0),
  active boolean DEFAULT true,
  PRIMARY KEY (product_id, variant_option_id)
);

-- Create product_customizable_ingredients link table
CREATE TABLE product_customizable_ingredients (
  product_id integer REFERENCES products(id) ON DELETE CASCADE,
  ingredient_option_id integer REFERENCES ingredient_options(id),
  active boolean DEFAULT true,
  PRIMARY KEY (product_id, ingredient_option_id)
);

-- Enable RLS on new tables
ALTER TABLE variant_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_customizable_ingredients ENABLE ROW LEVEL SECURITY;

-- Create staff access policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "staff_access_policy" ON variant_options;
  DROP POLICY IF EXISTS "staff_access_policy" ON ingredient_options;
  DROP POLICY IF EXISTS "staff_access_policy" ON product_variants;
  DROP POLICY IF EXISTS "staff_access_policy" ON product_customizable_ingredients;

  -- Create new policies
  EXECUTE 'CREATE POLICY "staff_access_policy" ON variant_options FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM staff_users WHERE staff_users.id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM staff_users WHERE staff_users.id = auth.uid()))';
  
  EXECUTE 'CREATE POLICY "staff_access_policy" ON ingredient_options FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM staff_users WHERE staff_users.id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM staff_users WHERE staff_users.id = auth.uid()))';
  
  EXECUTE 'CREATE POLICY "staff_access_policy" ON product_variants FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM staff_users WHERE staff_users.id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM staff_users WHERE staff_users.id = auth.uid()))';
  
  EXECUTE 'CREATE POLICY "staff_access_policy" ON product_customizable_ingredients FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM staff_users WHERE staff_users.id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM staff_users WHERE staff_users.id = auth.uid()))';
END $$;

-- Create indexes for foreign keys
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_variant ON product_variants(variant_option_id);
CREATE INDEX idx_product_ingredients_product ON product_customizable_ingredients(product_id);
CREATE INDEX idx_product_ingredients_ingredient ON product_customizable_ingredients(ingredient_option_id);

-- Insert initial data
INSERT INTO variant_options (name) VALUES ('Tasajo') ON CONFLICT DO NOTHING;
INSERT INTO ingredient_options (name) VALUES ('Tasajo') ON CONFLICT DO NOTHING;