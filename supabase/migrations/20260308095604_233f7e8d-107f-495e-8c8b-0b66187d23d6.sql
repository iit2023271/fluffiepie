
-- Store config for dynamic categories, flavours, occasions
CREATE TABLE public.store_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_type text NOT NULL, -- 'category', 'flavour', 'occasion'
  value text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(config_type, value)
);

ALTER TABLE public.store_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read active config
CREATE POLICY "Anyone can view active config"
  ON public.store_config FOR SELECT
  USING (is_active = true);

-- Admins can manage config
CREATE POLICY "Admins can manage config"
  ON public.store_config FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Coupons table
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
  discount_value integer NOT NULL DEFAULT 0,
  min_order_amount integer NOT NULL DEFAULT 0,
  max_discount integer DEFAULT NULL,
  is_active boolean NOT NULL DEFAULT true,
  usage_limit integer DEFAULT NULL,
  used_count integer NOT NULL DEFAULT 0,
  expires_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Admins can manage coupons
CREATE POLICY "Admins can manage coupons"
  ON public.coupons FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can view active coupons (for validation)
CREATE POLICY "Users can view active coupons"
  ON public.coupons FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Seed default categories, flavours, occasions
INSERT INTO public.store_config (config_type, value, sort_order) VALUES
  ('category', 'Classic', 1),
  ('category', 'Premium', 2),
  ('category', 'Chocolate', 3),
  ('category', 'Fruit', 4),
  ('flavour', 'Chocolate', 1),
  ('flavour', 'Vanilla', 2),
  ('flavour', 'Red Velvet', 3),
  ('flavour', 'Butterscotch', 4),
  ('flavour', 'Strawberry', 5),
  ('flavour', 'Mango', 6),
  ('flavour', 'Blueberry', 7),
  ('flavour', 'Pineapple', 8),
  ('occasion', 'Birthday', 1),
  ('occasion', 'Wedding', 2),
  ('occasion', 'Anniversary', 3),
  ('occasion', 'Custom', 4);

-- Seed a default coupon
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_amount, max_discount) VALUES
  ('SWEET10', 'percentage', 10, 0, 500);
