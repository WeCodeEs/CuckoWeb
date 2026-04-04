/*
  # Enable RLS on 5 unprotected tables

  These tables had well-written policies but RLS was never enabled,
  making the policies decorative (not enforced).

  1. Tables affected
    - `orders` - Has 4 policies (Admin ALL, Operator SELECT+UPDATE, Student SELECT own)
    - `order_details` - Has 2 policies (Admin ALL, Operator SELECT)
    - `products` - Has 6 policies (Admin ALL, Operator CRUD, Authenticated SELECT)
    - `notifications` - Has 6 policies (will be cleaned up in next migration)
    - `store_details` - Has 1 SELECT public policy (write protection added in next migration)

  2. Security impact
    - All existing policies will now be enforced
    - Edge Functions using service_role bypass RLS and are unaffected
*/

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_details ENABLE ROW LEVEL SECURITY;
