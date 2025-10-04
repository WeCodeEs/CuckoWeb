/*
  # Fix User Schema to Use UUIDs

  1. Changes
    - Drop existing tables and dependencies
    - Recreate tables with UUID primary keys
    - Update foreign key relationships
    - Fix RLS policies
    - Add proper indexes

  2. Security
    - Maintain RLS policies
    - Update authentication checks
    - Ensure proper cascading
*/

-- Temporarily disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_users DISABLE ROW LEVEL SECURITY;

-- Drop existing foreign key constraints
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_user_id_fkey;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE otps DROP CONSTRAINT IF EXISTS otps_user_id_fkey;
ALTER TABLE change_logs DROP CONSTRAINT IF EXISTS change_logs_staff_user_id_fkey;

-- Create temporary tables to store existing data
CREATE TEMP TABLE temp_users AS SELECT * FROM users;
CREATE TEMP TABLE temp_staff_users AS SELECT * FROM staff_users;

-- Drop existing tables
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS staff_users CASCADE;

-- Recreate staff_users table with UUID
CREATE TABLE staff_users (
  uuid UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role staff_role_enum NOT NULL DEFAULT 'Operador',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_staff_uuid 
    FOREIGN KEY (uuid) REFERENCES auth.users(id) 
    ON DELETE CASCADE
);

-- Recreate users table with UUID
CREATE TABLE users (
  uuid UUID PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  faculty_id INTEGER REFERENCES faculties(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_user_uuid 
    FOREIGN KEY (uuid) REFERENCES auth.users(id) 
    ON DELETE CASCADE
);

-- Update related tables to use UUID
ALTER TABLE notifications 
  ADD COLUMN user_uuid UUID REFERENCES users(uuid) ON DELETE CASCADE,
  DROP COLUMN IF EXISTS user_id;

ALTER TABLE orders 
  ADD COLUMN user_uuid UUID REFERENCES users(uuid) ON DELETE CASCADE,
  DROP COLUMN IF EXISTS user_id;

ALTER TABLE payments 
  ADD COLUMN user_uuid UUID REFERENCES users(uuid) ON DELETE CASCADE,
  DROP COLUMN IF EXISTS user_id;

ALTER TABLE reviews 
  ADD COLUMN user_uuid UUID REFERENCES users(uuid) ON DELETE CASCADE,
  DROP COLUMN IF EXISTS user_id;

ALTER TABLE otps 
  ADD COLUMN user_uuid UUID REFERENCES users(uuid) ON DELETE CASCADE,
  DROP COLUMN IF EXISTS user_id;

ALTER TABLE change_logs 
  RENAME COLUMN staff_user_id TO staff_uuid;

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_faculty ON users(faculty_id);
CREATE INDEX idx_staff_users_email ON staff_users(email);
CREATE INDEX idx_staff_users_active ON staff_users(active);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;

-- Update RLS policies for users
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Staff can view all users" ON users;

CREATE POLICY "Users can view own profile" 
  ON users
  FOR SELECT 
  TO authenticated
  USING (uuid = auth.uid());

CREATE POLICY "Staff can view all users" 
  ON users
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.uuid = auth.uid()
    )
  );

-- Update RLS policies for staff_users
DROP POLICY IF EXISTS "Allow admin full access" ON staff_users;
DROP POLICY IF EXISTS "Allow self read" ON staff_users;
DROP POLICY IF EXISTS "Allow self update" ON staff_users;
DROP POLICY IF EXISTS "Enable registration" ON staff_users;

CREATE POLICY "Allow admin full access"
  ON staff_users
  FOR ALL
  TO authenticated
  USING (role = 'Administrador');

CREATE POLICY "Allow self read"
  ON staff_users
  FOR SELECT
  TO authenticated
  USING (uuid = auth.uid());

CREATE POLICY "Allow self update"
  ON staff_users
  FOR UPDATE
  TO authenticated
  USING (uuid = auth.uid())
  WITH CHECK (uuid = auth.uid());

CREATE POLICY "Enable registration"
  ON staff_users
  FOR INSERT
  TO authenticated
  WITH CHECK (uuid = auth.uid());