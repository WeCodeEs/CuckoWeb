/*
  # Fix change_logs trigger function

  1. Changes
    - Update log_order_status_change function to use staff_uuid instead of staff_user_id
    - This fixes the error when updating order status

  2. Details
    - The function was trying to use a non-existent column name staff_user_id
    - The correct column name in change_logs table is staff_uuid
*/

CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO change_logs (
    staff_uuid,
    table_name,
    record_id,
    action,
    details
  ) VALUES (
    auth.uid(),
    'orders',
    NEW.id::text,
    'update_status',
    jsonb_build_object(
      'old_status', OLD.status,
      'new_status', NEW.status
    )
  );
  RETURN NEW;
END;
$function$;