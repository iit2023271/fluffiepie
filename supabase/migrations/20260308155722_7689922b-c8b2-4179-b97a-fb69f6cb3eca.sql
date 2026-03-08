CREATE POLICY "Users can view notes on their own orders"
ON public.order_notes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_notes.order_id
    AND orders.user_id = auth.uid()
  )
);