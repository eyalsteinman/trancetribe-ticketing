-- Add start and end time to parties
ALTER TABLE public.parties
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME;

-- Allow admins to delete parties
DROP POLICY IF EXISTS "Admins can delete parties" ON public.parties;
CREATE POLICY "Admins can delete parties"
ON public.parties
FOR DELETE
USING (has_role(auth.uid(), 'admin'::public.app_role));