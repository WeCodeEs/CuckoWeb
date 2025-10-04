-- Drop existing objects to ensure clean slate
DROP TABLE IF EXISTS change_logs CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_details CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS product_customizable_ingredients CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS ingredient_options CASCADE;
DROP TABLE IF EXISTS variant_options CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS menus CASCADE;
DROP TABLE IF EXISTS otps CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS faculties CASCADE;
DROP TABLE IF EXISTS staff_users CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS staff_role_enum CASCADE;
DROP TYPE IF EXISTS order_status_enum CASCADE;
DROP TYPE IF EXISTS payment_status_enum CASCADE;
DROP TYPE IF EXISTS notification_type_enum CASCADE;

-- Create ENUM types
CREATE TYPE staff_role_enum AS ENUM ('Administrador', 'Operador');
CREATE TYPE order_status_enum AS ENUM ('PendientePago', 'Pagado', 'EnPreparacion', 'Listo', 'Entregado', 'Cancelado');
CREATE TYPE payment_status_enum AS ENUM ('Pendiente', 'Completado', 'Fallido');
CREATE TYPE notification_type_enum AS ENUM ('PedidoListo', 'PedidoCancelado', 'PedidoEnPreparacion', 'NotificacionGeneral');

-- Create staff_users table
CREATE TABLE staff_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  role staff_role_enum NOT NULL DEFAULT 'Operador',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create faculties table
CREATE TABLE faculties (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create users table
CREATE TABLE users (
  id serial PRIMARY KEY,
  auth_uuid uuid UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  faculty_id integer REFERENCES faculties(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create otps table
CREATE TABLE otps (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users(id) ON DELETE CASCADE,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create menus table
CREATE TABLE menus (
  id serial PRIMARY KEY,
  name text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create categories table
CREATE TABLE categories (
  id serial PRIMARY KEY,
  menu_id integer REFERENCES menus(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE products (
  id serial PRIMARY KEY,
  category_id integer REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  base_price decimal(10,2) NOT NULL CHECK (base_price >= 0),
  image_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create variant_options table
CREATE TABLE variant_options (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  additional_price decimal(10,2) NOT NULL DEFAULT 0 CHECK (additional_price >= 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create ingredient_options table
CREATE TABLE ingredient_options (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  extra_price decimal(10,2) NOT NULL DEFAULT 0 CHECK (extra_price >= 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create product_variants link table
CREATE TABLE product_variants (
  product_id integer REFERENCES products(id) ON DELETE CASCADE,
  variant_option_id integer REFERENCES variant_options(id),
  additional_price decimal(10,2) DEFAULT 0 CHECK (additional_price >= 0),
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

-- Create orders table
CREATE TABLE orders (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users(id) ON DELETE CASCADE,
  status order_status_enum NOT NULL DEFAULT 'PendientePago',
  total decimal(10,2) NOT NULL CHECK (total >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create order_details table
CREATE TABLE order_details (
  id serial PRIMARY KEY,
  order_id integer REFERENCES orders(id) ON DELETE CASCADE,
  product_id integer REFERENCES products(id),
  product_variant_id integer,
  variant_option_id integer,
  quantity integer NOT NULL CHECK (quantity >= 1),
  unit_price decimal(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal decimal(10,2) NOT NULL CHECK (subtotal >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_details_product_variant_fk 
    FOREIGN KEY (product_id, variant_option_id) 
    REFERENCES product_variants(product_id, variant_option_id)
);

-- Create payments table
CREATE TABLE payments (
  id serial PRIMARY KEY,
  order_id integer REFERENCES orders(id) ON DELETE CASCADE,
  user_id integer REFERENCES users(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL CHECK (amount >= 0),
  status payment_status_enum NOT NULL DEFAULT 'Pendiente',
  payment_method text,
  transaction_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE notifications (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users(id) ON DELETE CASCADE,
  order_id integer REFERENCES orders(id) ON DELETE SET NULL,
  type notification_type_enum NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create reviews table
CREATE TABLE reviews (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users(id) ON DELETE CASCADE,
  product_id integer REFERENCES products(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create change_logs table
CREATE TABLE change_logs (
  id serial PRIMARY KEY,
  staff_user_id uuid REFERENCES staff_users(id) ON DELETE SET NULL,
  table_name text NOT NULL,
  record_id text NOT NULL,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  change_timestamp timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_staff_users_email ON staff_users(email);
CREATE INDEX idx_staff_users_active ON staff_users(active);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_uuid ON users(auth_uuid);
CREATE INDEX idx_users_faculty ON users(faculty_id);
CREATE INDEX idx_otps_user ON otps(user_id);
CREATE INDEX idx_categories_menu ON categories(menu_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_variant ON product_variants(variant_option_id);
CREATE INDEX idx_product_ingredients_product ON product_customizable_ingredients(product_id);
CREATE INDEX idx_product_ingredients_ingredient ON product_customizable_ingredients(ingredient_option_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_details_order ON order_details(order_id);
CREATE INDEX idx_order_details_product_variant ON order_details(product_id, variant_option_id);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_order ON notifications(order_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_change_logs_staff_user ON change_logs(staff_user_id);
CREATE INDEX idx_change_logs_table_name ON change_logs(table_name);

-- Enable Row Level Security
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_customizable_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_logs ENABLE ROW LEVEL SECURITY;

-- Create staff_users policies
CREATE POLICY "Enable staff registration"
  ON staff_users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Staff can view own profile"
  ON staff_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow admin full access"
  ON staff_users
  FOR ALL
  TO authenticated
  USING (role = 'Administrador');

-- Create users policies
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth_uuid = auth.uid());

CREATE POLICY "Staff can view all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid()
    )
  );

-- Create staff access policies for all other tables
DO $$ 
DECLARE
  table_name text;
BEGIN
  FOR table_name IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN (
      'menus', 'categories', 'products', 'variant_options', 
      'ingredient_options', 'product_variants', 
      'product_customizable_ingredients', 'orders', 
      'order_details', 'payments', 'notifications', 
      'reviews', 'change_logs'
    )
  LOOP
    EXECUTE format('
      CREATE POLICY "staff_access_policy" ON %I
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
      )
    ', table_name);
  END LOOP;
END $$;

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product_images', 'product_images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "authenticated_staff_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product_images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "authenticated_staff_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product_images')
WITH CHECK (bucket_id = 'product_images');

CREATE POLICY "authenticated_staff_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product_images');

CREATE POLICY "public_read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product_images');