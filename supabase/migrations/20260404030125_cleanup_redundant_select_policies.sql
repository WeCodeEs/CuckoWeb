/*
  # Clean up redundant SELECT policies on categories and menus

  Both tables have multiple overlapping SELECT policies that are
  redundant because a broader policy already covers the same access.

  1. categories
    - KEPT: "Authenticated users can view all categories" (SELECT, authenticated, true)
    - KEPT: "Enable read access for all users" (SELECT, public, true)
    - REMOVED: "Operators can view all categories" (redundant - already covered by authenticated SELECT with true)

  2. menus
    - KEPT: "Allow authenticated users to read all menus" (SELECT, authenticated, true)
    - KEPT: "Enable read access for all users" (SELECT, public, true)
    - REMOVED: "Allow staff to read all menus" (redundant - already covered by authenticated SELECT with true)

  3. Security impact
    - No change in effective access, just removing noise
*/

DROP POLICY IF EXISTS "Operators can view all categories" ON categories;
DROP POLICY IF EXISTS "Allow staff to read all menus" ON menus;
