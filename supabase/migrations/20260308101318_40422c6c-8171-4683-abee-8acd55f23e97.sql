
-- Create reviews table
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rating integer NOT NULL,
  title text,
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id, order_id)
);

-- Create validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_review_rating()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_review_rating
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_review_rating();

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update product rating when review is added/updated/deleted
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _product_id uuid;
  _avg_rating numeric;
  _count integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _product_id := OLD.product_id;
  ELSE
    _product_id := NEW.product_id;
  END IF;

  SELECT COALESCE(AVG(rating), 0), COUNT(*)
  INTO _avg_rating, _count
  FROM public.reviews
  WHERE product_id = _product_id;

  UPDATE public.products
  SET rating = ROUND(_avg_rating, 1),
      review_count = _count
  WHERE id = _product_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_product_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_product_rating();
