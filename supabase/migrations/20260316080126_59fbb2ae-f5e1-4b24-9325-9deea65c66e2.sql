
-- Create a trigger function that updates coupon used_count based on delivered orders
CREATE OR REPLACE FUNCTION public.update_coupon_used_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When order status changes TO 'delivered' and has a coupon_code
  IF NEW.status = 'delivered' AND NEW.coupon_code IS NOT NULL AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    UPDATE public.coupons
    SET used_count = used_count + 1
    WHERE code = NEW.coupon_code;
  END IF;

  -- When order status changes FROM 'delivered' to something else (undo) and has a coupon_code
  IF OLD.status = 'delivered' AND NEW.status != 'delivered' AND NEW.coupon_code IS NOT NULL THEN
    UPDATE public.coupons
    SET used_count = GREATEST(used_count - 1, 0)
    WHERE code = NEW.coupon_code;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_update_coupon_used_count ON public.orders;

-- Create the trigger on orders table
CREATE TRIGGER trg_update_coupon_used_count
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_coupon_used_count();

-- Also sync existing delivered orders' coupon counts right now
UPDATE public.coupons c
SET used_count = COALESCE(sub.cnt, 0)
FROM (
  SELECT coupon_code, COUNT(*) as cnt
  FROM public.orders
  WHERE status = 'delivered' AND coupon_code IS NOT NULL
  GROUP BY coupon_code
) sub
WHERE c.code = sub.coupon_code;
