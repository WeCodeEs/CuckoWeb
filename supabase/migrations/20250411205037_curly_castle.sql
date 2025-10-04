/*
  # Add function to list all staff users including orphaned auth users

  1. Changes
    - Create a function that joins auth.users with staff_users
    - Returns combined data for UI display
    - Includes flag for orphaned accounts

  2. Security
    - Function uses SECURITY DEFINER to access auth schema
    - Only accessible by authenticated users
*/

CREATE OR REPLACE FUNCTION public.list_all_staff_users()
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  role text,
  active boolean,
  created_at timestamptz,
  has_profile boolean
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    au.id,
    COALESCE(su.full_name, '') as full_name,
    au.email,
    CASE 
      WHEN su.id IS NULL THEN 'Sin perfil'::text
      ELSE su.role::text
    END as role,
    COALESCE(su.active, false) as active,
    au.created_at,
    (su.id IS NOT NULL) as has_profile
  FROM auth.users au
  LEFT JOIN public.staff_users su ON su.id = au.id
  ORDER BY au.created_at DESC;
$$;

-- Revoke execute from public and grant to authenticated users only
REVOKE EXECUTE ON FUNCTION public.list_all_staff_users() FROM public;
GRANT EXECUTE ON FUNCTION public.list_all_staff_users() TO authenticated;