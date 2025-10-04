/*
  # Initial Cafeteria Management System Schema

  1. New Types
    - staff_role_enum: Roles for staff members
    - menu_status_enum: Status for menus
    - order_status_enum: Status for orders
    - payment_status_enum: Status for payments
    - notification_type_enum: Types of notifications

  2. New Tables
    - staff_users: Staff members with authentication
    - faculties: University faculties
    - users: App customers
    - otps: One-time passwords for users
    - menus: Available menus
    - categories: Product categories
    - products: Individual products
    - variants: Product variants
    - orders: Customer orders
    - order_details: Order line items
    - payments: Order payments
    - notifications: System notifications
    - reviews: Product reviews
    - change_logs: System audit logs

  3. Security
    - RLS enabled on all tables
    - Policies for staff and customer access
    - Appropriate CASCADE rules

  4. Indexes
    - Optimized for common queries
    - Foreign key indexes
    - Search columns
*/

-- Create ENUM types
CREATE TYPE staff_role_enum AS ENUM ('Administrador', 'Operador');
CREATE TYPE menu_status_enum AS ENUM ('Activo', 'Inactivo');
CREATE TYPE order_status_enum AS ENUM ('PendientePago', 'Pagado', 'EnPreparacion', 'Listo', 'Entregado', 'Cancelado');
CREATE TYPE payment_status_enum AS ENUM ('Pendiente', 'Completado', 'Fallido');
CREATE TYPE notification_type_enum AS ENUM ('PedidoListo', 'PedidoCancelado', 'PedidoEnPreparacion', 'NotificacionGeneral');

-- Create staff_users table
CREATE TABLE IF NOT EXISTS staff_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  role staff_role_enum NOT NULL DEFAULT 'Operador',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create faculties table
CREATE TABLE IF NOT EXISTS faculties (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS otps (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users(id) ON DELETE CASCADE,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create menus table
CREATE TABLE IF NOT EXISTS menus (
  id serial PRIMARY KEY,
  name text NOT NULL,
  description text,
  status menu_status_enum NOT NULL DEFAULT 'Inactivo',
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id serial PRIMARY KEY,
  menu_id integer REFERENCES menus(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
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

-- Create variants table
CREATE TABLE IF NOT EXISTS variants (
  id serial PRIMARY KEY,
  product_id integer REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  additional_price decimal(10,2) NOT NULL DEFAULT 0 CHECK (additional_price >= 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users(id) ON DELETE CASCADE,
  status order_status_enum NOT NULL DEFAULT 'PendientePago',
  total decimal(10,2) NOT NULL CHECK (total >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create order_details table
CREATE TABLE IF NOT EXISTS order_details (
  id serial PRIMARY KEY,
  order_id integer REFERENCES orders(id) ON DELETE CASCADE,
  product_id integer REFERENCES products(id),
  variant_id integer REFERENCES variants(id),
  quantity integer NOT NULL CHECK (quantity >= 1),
  unit_price decimal(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal decimal(10,2) NOT NULL CHECK (subtotal >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
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
CREATE TABLE IF NOT EXISTS notifications (
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
CREATE TABLE IF NOT EXISTS reviews (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users(id) ON DELETE CASCADE,
  product_id integer REFERENCES products(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create change_logs table
CREATE TABLE IF NOT EXISTS change_logs (
  id serial PRIMARY KEY,
  staff_user_id uuid REFERENCES staff_users(id) ON DELETE SET NULL,
  table_name text NOT NULL,
  record_id text NOT NULL,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  change_timestamp timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for staff_users
CREATE POLICY "Staff can view own profile" ON staff_users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all staff" ON staff_users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid() AND role = 'Administrador'
    )
  );

-- Create policies for users
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT TO authenticated
  USING (auth_uuid = auth.uid());

CREATE POLICY "Staff can view all users" ON users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_staff_users_email ON staff_users(email);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_uuid ON users(auth_uuid);
CREATE INDEX idx_users_faculty ON users(faculty_id);
CREATE INDEX idx_otps_user ON otps(user_id);
CREATE INDEX idx_categories_menu ON categories(menu_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_variants_product ON variants(product_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_details_order ON order_details(order_id);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_order ON notifications(order_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_change_logs_staff_user ON change_logs(staff_user_id);
CREATE INDEX idx_change_logs_table_name ON change_logs(table_name);