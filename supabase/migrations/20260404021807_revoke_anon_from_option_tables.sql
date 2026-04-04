/*
  # Revoke anon permissions on option tables

  1. Security Change
    - Remove all permissions for the anon role on option-related tables
    - Only authenticated users will be able to access these tables
    - This prevents any unauthenticated access at the database level

  2. Tables Affected
    - option_groups
    - options
    - product_option_groups
    - product_option_group_options
*/

REVOKE ALL ON option_groups FROM anon;
REVOKE ALL ON options FROM anon;
REVOKE ALL ON product_option_groups FROM anon;
REVOKE ALL ON product_option_group_options FROM anon;
