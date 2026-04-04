/*
  # Grant Permissions on Option Tables to anon and authenticated roles

  1. Problem
    - Tables option_groups, options, product_option_groups, product_option_group_options
      only have GRANT permissions for the postgres role
    - The Supabase client uses anon/authenticated roles which have no access
    - This causes "permission denied" errors from the client

  2. Solution
    - GRANT SELECT, INSERT, UPDATE, DELETE on all four tables to anon and authenticated
    - This allows RLS policies to take effect (RLS is already enabled)

  3. Tables Affected
    - option_groups
    - options
    - product_option_groups
    - product_option_group_options
*/

GRANT SELECT, INSERT, UPDATE, DELETE ON option_groups TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON options TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_option_groups TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_option_group_options TO anon, authenticated;
