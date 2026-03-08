
-- Add stock tracking to products
ALTER TABLE public.products 
  ADD COLUMN stock_quantity integer NOT NULL DEFAULT 100,
  ADD COLUMN low_stock_threshold integer NOT NULL DEFAULT 10,
  ADD COLUMN sku text;

-- Order notes for CRM
CREATE TABLE public.order_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  admin_user_id uuid NOT NULL,
  note text NOT NULL,
  note_type text NOT NULL DEFAULT 'general',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage order notes"
  ON public.order_notes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Refund tracking on orders
ALTER TABLE public.orders
  ADD COLUMN refund_amount integer NOT NULL DEFAULT 0,
  ADD COLUMN refund_reason text,
  ADD COLUMN refund_status text DEFAULT NULL,
  ADD COLUMN admin_notes text;

-- Customer tags/segments
CREATE TABLE public.customer_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tag text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, tag)
);

ALTER TABLE public.customer_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage customer tags"
  ON public.customer_tags FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Banners table for marketing
CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text,
  link_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage banners"
  ON public.banners FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active banners"
  ON public.banners FOR SELECT
  USING (is_active = true);

-- Function to decrement stock on order placement
CREATE OR REPLACE FUNCTION public.decrement_product_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  item jsonb;
  _product_id text;
  _quantity int;
BEGIN
  IF NEW.status = 'placed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
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
  RETURN NEW;
END;
$$;

CREATE TRIGGER decrement_stock_on_order
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.decrement_product_stock();
