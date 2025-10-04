/*
  # Create and configure product images storage bucket

  1. Changes
    - Create a new storage bucket for product images
    - Set up RLS policies for the bucket
    - Allow authenticated staff to manage images

  2. Security
    - Only authenticated staff can upload/delete images
    - Public read access for stored images
*/

-- Enable storage by creating the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product_images', 'product_images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket
CREATE POLICY "Staff can upload product images"
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

CREATE POLICY "Staff can update product images"
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

CREATE POLICY "Staff can delete product images"
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

CREATE POLICY "Public can view product images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product_images');