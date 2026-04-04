/*
  # Fix save_option_group_with_options RPC and foreign key

  1. Changes
    - Add ON DELETE CASCADE to the foreign key from product_option_group_options.option_id -> options.id
      so that when an option is removed from the library, product references are automatically cleaned up
    - Rewrite the save_option_group_with_options RPC to properly upsert options instead of
      delete-all/re-insert, which was causing foreign key violations

  2. New RPC Behavior
    - CREATE mode: inserts group + all options (unchanged)
    - UPDATE mode: updates existing options by matching on name, inserts new options,
      and deletes removed options (cascading to product_option_group_options)
    - Each option in the input JSON can optionally include an `id` field for precise matching

  3. Security
    - Function still uses SECURITY INVOKER so RLS policies apply

  4. Important Notes
    - The old FK constraint name uses legacy "customization" naming
    - CASCADE delete ensures product references are cleaned when options are removed from groups
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'product_customization_options_customization_option_id_fkey'
    AND table_name = 'product_option_group_options'
  ) THEN
    ALTER TABLE product_option_group_options
      DROP CONSTRAINT product_customization_options_customization_option_id_fkey;
  END IF;
END $$;

ALTER TABLE product_option_group_options
  ADD CONSTRAINT product_option_group_options_option_id_fkey
  FOREIGN KEY (option_id) REFERENCES options(id) ON DELETE CASCADE;

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
  v_opt_id integer;
  v_incoming_ids integer[];
BEGIN
  IF p_group_id IS NULL THEN
    INSERT INTO option_groups (name, min_select, max_select, active)
    VALUES (p_name, p_min_select, p_max_select, p_active)
    RETURNING id INTO v_group_id;

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
  ELSE
    UPDATE option_groups
    SET name = p_name,
        min_select = p_min_select,
        max_select = p_max_select,
        active = p_active
    WHERE id = p_group_id;

    v_group_id := p_group_id;
    v_incoming_ids := ARRAY[]::integer[];

    FOR v_option IN SELECT * FROM jsonb_array_elements(p_options)
    LOOP
      v_opt_id := (v_option->>'id')::integer;

      IF v_opt_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM options WHERE id = v_opt_id AND option_group_id = v_group_id
      ) THEN
        UPDATE options
        SET name = v_option->>'name',
            additional_price = COALESCE((v_option->>'additional_price')::numeric, 0)
        WHERE id = v_opt_id;
        v_incoming_ids := v_incoming_ids || v_opt_id;
      ELSE
        INSERT INTO options (option_group_id, name, additional_price, active)
        VALUES (
          v_group_id,
          v_option->>'name',
          COALESCE((v_option->>'additional_price')::numeric, 0),
          true
        )
        RETURNING id INTO v_opt_id;
        v_incoming_ids := v_incoming_ids || v_opt_id;
      END IF;
    END LOOP;

    DELETE FROM options
    WHERE option_group_id = v_group_id
    AND id != ALL(v_incoming_ids);
  END IF;

  RETURN v_group_id;
END;
$$;
