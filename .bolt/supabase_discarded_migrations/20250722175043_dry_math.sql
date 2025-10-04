/*
  # Export All RLS Policies

  This migration contains all the Row Level Security (RLS) policies from the current project.
  It enables RLS on all tables and recreates all existing policies.

  ## Tables with RLS:
  1. Categories - RLS policies for staff access control
  2. Change Logs - RLS enabled (no specific policies)
  3. Faculties - RLS enabled (no specific policies)
  4. Ingredient Options - RLS policies for staff and authenticated users
  5. Menus - RLS policies for staff access control
  6. Notifications - RLS enabled (no specific policies)
  7. Order Detail Ingredients - RLS policies for staff access
  8. Order Details - RLS policies for staff access
  9. Orders - RLS policies for staff access control
  10. Product Customizable Ingredients - RLS policies for staff access
  11. Product Variants - RLS policies for staff access control
  12. Products - RLS policies for staff access control
  13. Reviews - RLS enabled (no specific policies)
  14. Staff Users - RLS policies for self-access and admin control
  15. Users - RLS policies for staff and self-access
  16. Variant Options - RLS policies for staff access control
*/

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_detail_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_customizable_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_options ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Administrators have full access to categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Administrador'::staff_role_enum) AND (staff_users.active = true))))
  WITH CHECK (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Administrador'::staff_role_enum) AND (staff_users.active = true))));

CREATE POLICY "Authenticated users can view active categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Operators can delete categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])) AND (staff_users.active = true))));

CREATE POLICY "Operators can insert categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])) AND (staff_users.active = true))));

CREATE POLICY "Operators can update categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])) AND (staff_users.active = true))))
  WITH CHECK (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])) AND (staff_users.active = true))));

CREATE POLICY "Operators can view all categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Operador'::staff_role_enum) AND (staff_users.active = true))));

-- Ingredient Options policies
CREATE POLICY "Administrators have full access to ingredient options"
  ON ingredient_options
  FOR ALL
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Administrador'::staff_role_enum) AND (staff_users.active = true))))
  WITH CHECK (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Administrador'::staff_role_enum) AND (staff_users.active = true))));

CREATE POLICY "Authenticated users can view active ingredient options"
  ON ingredient_options
  FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Operators can delete ingredient options"
  ON ingredient_options
  FOR DELETE
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])) AND (staff_users.active = true))));

CREATE POLICY "Operators can insert ingredient options"
  ON ingredient_options
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])) AND (staff_users.active = true))));

CREATE POLICY "Operators can update ingredient options"
  ON ingredient_options
  FOR UPDATE
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Operador'::staff_role_enum) AND (staff_users.active = true))))
  WITH CHECK (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Operador'::staff_role_enum) AND (staff_users.active = true))));

CREATE POLICY "Operators can view all ingredient options"
  ON ingredient_options
  FOR SELECT
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Operador'::staff_role_enum) AND (staff_users.active = true))));

-- Menus policies
CREATE POLICY "Administrators have full access to menus"
  ON menus
  FOR ALL
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Administrador'::staff_role_enum) AND (staff_users.active = true))))
  WITH CHECK (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Administrador'::staff_role_enum) AND (staff_users.active = true))));

CREATE POLICY "Authenticated users can view active menus"
  ON menus
  FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Operators can delete menus"
  ON menus
  FOR DELETE
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])) AND (staff_users.active = true))));

CREATE POLICY "Operators can insert menus"
  ON menus
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])) AND (staff_users.active = true))));

CREATE POLICY "Operators can update menus"
  ON menus
  FOR UPDATE
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])) AND (staff_users.active = true))))
  WITH CHECK (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])) AND (staff_users.active = true))));

CREATE POLICY "Operators can view all menus"
  ON menus
  FOR SELECT
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Operador'::staff_role_enum) AND (staff_users.active = true))));

-- Order Detail Ingredients policies
CREATE POLICY "Administrators have full access to order detail ingredients"
  ON order_detail_ingredients
  FOR ALL
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Administrador'::staff_role_enum) AND (staff_users.active = true))))
  WITH CHECK (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Administrador'::staff_role_enum) AND (staff_users.active = true))));

CREATE POLICY "Operators can view order detail ingredients"
  ON order_detail_ingredients
  FOR SELECT
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Operador'::staff_role_enum) AND (staff_users.active = true))));

-- Order Details policies
CREATE POLICY "Administrators have full access to order details"
  ON order_details
  FOR ALL
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Administrador'::staff_role_enum) AND (staff_users.active = true))))
  WITH CHECK (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Administrador'::staff_role_enum) AND (staff_users.active = true))));

CREATE POLICY "Operators can view order details"
  ON order_details
  FOR SELECT
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Operador'::staff_role_enum) AND (staff_users.active = true))));

-- Orders policies
CREATE POLICY "Administrators have full access to orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Administrador'::staff_role_enum) AND (staff_users.active = true))))
  WITH CHECK (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Administrador'::staff_role_enum) AND (staff_users.active = true))));

CREATE POLICY "Operators can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Operador'::staff_role_enum) AND (staff_users.active = true))))
  WITH CHECK (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Operador'::staff_role_enum) AND (staff_users.active = true))));

CREATE POLICY "Operators can view and update orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Operador'::staff_role_enum) AND (staff_users.active = true))));

-- Product Customizable Ingredients policies
CREATE POLICY "Administrators have full access to product ingredients"
  ON product_customizable_ingredients
  FOR ALL
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Administrador'::staff_role_enum) AND (staff_users.active = true))))
  WITH CHECK (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Administrador'::staff_role_enum) AND (staff_users.active = true))));

CREATE POLICY "Authenticated users can view active product ingredients"
  ON product_customizable_ingredients
  FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Operators can delete product ingredients"
  ON product_customizable_ingredients
  FOR DELETE
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])) AND (staff_users.active = true))));

CREATE POLICY "Operators can insert product ingredients"
  ON product_customizable_ingredients
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])) AND (staff_users.active = true))));

CREATE POLICY "Operators can update product ingredients"
  ON product_customizable_ingredients
  FOR UPDATE
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])) AND (staff_users.active = true))))
  WITH CHECK (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])) AND (staff_users.active = true))));

CREATE POLICY "Operators can view all product ingredients"
  ON product_customizable_ingredients
  FOR SELECT
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])) AND (staff_users.active = true))));

-- Product Variants policies
CREATE POLICY "Administrators have full access to product variants"
  ON product_variants
  FOR ALL
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Administrador'::staff_role_enum) AND (staff_users.active = true))))
  WITH CHECK (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Administrador'::staff_role_enum) AND (staff_users.active = true))));

CREATE POLICY "Authenticated users can view active product variants"
  ON product_variants
  FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Operators can delete product variants"
  ON product_variants
  FOR DELETE
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])) AND (staff_users.active = true))));

CREATE POLICY "Operators can insert product variants"
  ON product_variants
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])) AND (staff_users.active = true))));

CREATE POLICY "Operators can update product variants"
  ON product_variants
  FOR UPDATE
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])) AND (staff_users.active = true))))
  WITH CHECK (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])) AND (staff_users.active = true))));

CREATE POLICY "Operators can view all product variants"
  ON product_variants
  FOR SELECT
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])) AND (staff_users.active = true))));

-- Products policies
CREATE POLICY "Administrators have full access to products"
  ON products
  FOR ALL
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Administrador'::staff_role_enum) AND (staff_users.active = true))))
  WITH CHECK (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Administrador'::staff_role_enum) AND (staff_users.active = true))));

CREATE POLICY "Authenticated users can view active products"
  ON products
  FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Operators can delete products"
  ON products
  FOR DELETE
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])) AND (staff_users.active = true))));

CREATE POLICY "Operators can insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])) AND (staff_users.active = true))));

CREATE POLICY "Operators can update products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])) AND (staff_users.active = true))))
  WITH CHECK (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])) AND (staff_users.active = true))));

CREATE POLICY "Operators can view all products"
  ON products
  FOR SELECT
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Operador'::staff_role_enum) AND (staff_users.active = true))));

-- Staff Users policies
CREATE POLICY "Allow admin full access"
  ON staff_users
  FOR ALL
  TO authenticated
  USING (role = 'Administrador'::staff_role_enum);

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

-- Users policies
CREATE POLICY "Staff can view all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE (staff_users.uuid = auth.uid())));

CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (uuid = auth.uid());

-- Variant Options policies
CREATE POLICY "Administrators have full access to variant options"
  ON variant_options
  FOR ALL
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Administrador'::staff_role_enum) AND (staff_users.active = true))))
  WITH CHECK (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Administrador'::staff_role_enum) AND (staff_users.active = true))));

CREATE POLICY "Authenticated users can view active variant options"
  ON variant_options
  FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Operators can delete variant options"
  ON variant_options
  FOR DELETE
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])) AND (staff_users.active = true))));

CREATE POLICY "Operators can insert variant options"
  ON variant_options
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = ANY (ARRAY['Administrador'::staff_role_enum, 'Operador'::staff_role_enum])) AND (staff_users.active = true))));

CREATE POLICY "Operators can view all variant options"
  ON variant_options
  FOR SELECT
  TO authenticated
  USING (EXISTS ( SELECT 1
   FROM staff_users
  WHERE ((staff_users.uuid = auth.uid()) AND (staff_users.role = 'Operador'::staff_role_enum) AND (staff_users.active = true))));