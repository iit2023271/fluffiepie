-- Loyalty points table to track user balances
CREATE TABLE public.loyalty_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance integer NOT NULL DEFAULT 0,
  lifetime_earned integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Loyalty transactions for point history
CREATE TABLE public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  points integer NOT NULL,
  type text NOT NULL CHECK (type IN ('earned', 'redeemed', 'expired', 'bonus')),
  description text,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Push notification subscriptions
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Loyalty points policies
CREATE POLICY "Users can view their own points" ON public.loyalty_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all points" ON public.loyalty_points FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "System can upsert points" ON public.loyalty_points FOR ALL USING (true) WITH CHECK (true);

-- Loyalty transactions policies
CREATE POLICY "Users can view their own transactions" ON public.loyalty_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON public.loyalty_transactions FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert transactions" ON public.loyalty_transactions FOR INSERT WITH CHECK (true);

-- Push subscriptions policies
CREATE POLICY "Users can manage their own subscriptions" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all subscriptions" ON public.push_subscriptions FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Function to award points on order delivery
CREATE OR REPLACE FUNCTION public.award_loyalty_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  points_to_award integer;
BEGIN
  -- Award points when order is delivered (1 point per ₹10 spent)
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status <> 'delivered') THEN
    points_to_award := FLOOR(NEW.total / 10);
    
    -- Upsert loyalty points balance
    INSERT INTO public.loyalty_points (user_id, balance, lifetime_earned)
    VALUES (NEW.user_id, points_to_award, points_to_award)
    ON CONFLICT (user_id) DO UPDATE
    SET balance = loyalty_points.balance + points_to_award,
        lifetime_earned = loyalty_points.lifetime_earned + points_to_award,
        updated_at = now();
    
    -- Record transaction
    INSERT INTO public.loyalty_transactions (user_id, points, type, description, order_id)
    VALUES (NEW.user_id, points_to_award, 'earned', 'Points earned from order', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for awarding points
CREATE TRIGGER trigger_award_loyalty_points
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.award_loyalty_points();