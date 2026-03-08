-- Wishlist table
CREATE TABLE public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wishlist"
ON public.wishlists FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own wishlist"
ON public.wishlists FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their own wishlist"
ON public.wishlists FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Add cancellation_window_minutes to delivery_settings (handled in store_config JSON, no schema change needed)
-- Add cancel policy on orders for users
CREATE POLICY "Users can cancel their own recent orders"
ON public.orders FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  AND status = 'placed'
)
WITH CHECK (
  auth.uid() = user_id
  AND status = 'cancelled'
);