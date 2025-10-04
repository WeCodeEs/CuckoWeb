/*
  # Fix storage bucket policies for product images

  1. Changes
    - Drop existing policies to avoid conflicts
    - Create simplified policies for staff access
    - Add public read access policy
    - Fix authentication checks

  2. Security
    - Only authenticated staff can upload/delete images
    - Public read access for stored images
    - Proper authentication verification
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Staff can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Staff can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;

-- Create simplified policies
CREATE POLICY "Enable staff upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product_images' AND
  EXISTS (
    SELECT 1 FROM auth.users
    JOIN public.staff_users ON staff_users.id = auth.users.id
    WHERE auth.users.id = auth.uid()
  )
);

CREATE POLICY "Enable staff update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product_images' AND
  EXISTS (
    SELECT 1 FROM auth.users
    JOIN public.staff_users ON staff_users.id = auth.users.id
    WHERE auth.users.id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'product_images' AND
  EXISTS (
    SELECT 1 FROM auth.users
    JOIN public.staff_users ON staff_users.id = auth.users.id
    WHERE auth.users.id = auth.uid()
  )
);

CREATE POLICY "Enable staff delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product_images' AND
  EXISTS (
    SELECT 1 FROM auth.users
    JOIN public.staff_users ON staff_users.id = auth.users.id
    WHERE auth.users.id = auth.uid()
  )
);

CREATE POLICY "Enable public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product_images');