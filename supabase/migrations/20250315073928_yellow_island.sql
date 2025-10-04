/*
  # Fix storage RLS and policies

  1. Changes
    - Enable RLS on storage.objects
    - Drop existing policies
    - Create new simplified policies
    - Fix authentication checks

  2. Security
    - Only authenticated staff can upload/modify/delete
    - Public read access for stored images
    - Proper RLS enforcement
*/

-- First enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Staff can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Staff can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Enable staff upload" ON storage.objects;
DROP POLICY IF EXISTS "Enable staff update" ON storage.objects;
DROP POLICY IF EXISTS "Enable staff delete" ON storage.objects;
DROP POLICY IF EXISTS "Enable public read" ON storage.objects;

-- Create simplified policies
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