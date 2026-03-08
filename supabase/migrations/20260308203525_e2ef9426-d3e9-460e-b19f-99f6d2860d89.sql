-- Add user_id column to contact_messages
ALTER TABLE public.contact_messages ADD COLUMN user_id uuid;

-- Drop the old open insert policy
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;

-- Create new policy requiring auth
CREATE POLICY "Authenticated users can submit contact messages"
ON public.contact_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);