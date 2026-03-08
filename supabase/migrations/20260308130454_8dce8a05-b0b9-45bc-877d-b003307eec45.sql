
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;

CREATE OR REPLACE FUNCTION public.decrement_product_stock()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  item jsonb;
  _product_id text;
  _quantity int;
BEGIN
  IF TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'delivered' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'delivered') THEN
      FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
      LOOP
        _product_id := item->>'productId';
        _quantity := COALESCE((item->>'quantity')::int, 1);
        IF _product_id IS NOT NULL THEN
          UPDATE public.products
          SET stock_quantity = GREATEST(stock_quantity - _quantity, 0)
          WHERE id = _product_id::uuid;
        END IF;
      END LOOP;
    END IF;

    IF TG_OP = 'UPDATE' AND OLD.status = 'delivered' AND NEW.status IS DISTINCT FROM 'delivered' THEN
      FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
      LOOP
        _product_id := item->>'productId';
        _quantity := COALESCE((item->>'quantity')::int, 1);
        IF _product_id IS NOT NULL THEN
          UPDATE public.products
          SET stock_quantity = stock_quantity + _quantity
          WHERE id = _product_id::uuid;
        END IF;
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_order_status_change
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_product_stock();
