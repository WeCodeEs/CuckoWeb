/*
  # Transactional RPC: save_option_group_with_options

  1. New Function
    - `save_option_group_with_options` - Creates or updates an option group
      along with all its options in a single atomic transaction.

  2. Parameters
    - `p_group_id` (int, nullable) - NULL for new group, existing ID for update
    - `p_name` (text) - Group name
    - `p_min_select` (int) - Minimum selections required
    - `p_max_select` (int) - Maximum selections allowed
    - `p_active` (boolean) - Whether group is active
    - `p_options` (jsonb) - Array of {name, additional_price} objects

  3. Behavior
    - CREATE mode (p_group_id IS NULL): inserts group + all options
    - UPDATE mode (p_group_id IS NOT NULL): updates group, deletes old options,
      inserts new options
    - Returns the group ID

  4. Security
    - Function runs with SECURITY INVOKER so RLS policies apply
*/

CREATE OR REPLACE FUNCTION save_option_group_with_options(
  p_group_id integer DEFAULT NULL,
  p_name text DEFAULT '',
  p_min_select integer DEFAULT 0,
  p_max_select integer DEFAULT 1,
  p_active boolean DEFAULT true,
  p_options jsonb DEFAULT '[]'::jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_group_id integer;
  v_option jsonb;
BEGIN
  IF p_group_id IS NULL THEN
    INSERT INTO option_groups (name, min_select, max_select, active)
    VALUES (p_name, p_min_select, p_max_select, p_active)
    RETURNING id INTO v_group_id;
  ELSE
    UPDATE option_groups
    SET name = p_name,
        min_select = p_min_select,
        max_select = p_max_select,
        active = p_active
    WHERE id = p_group_id;

    v_group_id := p_group_id;

    DELETE FROM options WHERE option_group_id = v_group_id;
  END IF;

  FOR v_option IN SELECT * FROM jsonb_array_elements(p_options)
  LOOP
    INSERT INTO options (option_group_id, name, additional_price, active)
    VALUES (
      v_group_id,
      v_option->>'name',
      COALESCE((v_option->>'additional_price')::numeric, 0),
      true
    );
  END LOOP;

  RETURN v_group_id;
END;
$$;
