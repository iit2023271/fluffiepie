-- Fix overly permissive RLS policies by using service role function
DROP POLICY IF EXISTS "System can upsert points" ON public.loyalty_points;
DROP POLICY IF EXISTS "System can insert transactions" ON public.loyalty_transactions;

-- Add proper insert policy for loyalty_points (trigger runs as SECURITY DEFINER)
CREATE POLICY "Admins can manage points" ON public.loyalty_points FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add proper insert policy for loyalty_transactions
CREATE POLICY "Admins can manage transactions" ON public.loyalty_transactions FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));