-- Add soft delete flag for recipient on messages
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS deleted_by_recipient boolean NOT NULL DEFAULT false;

-- Allow admins to view all user socials
CREATE POLICY IF NOT EXISTS "Admins can view all socials"
ON public.user_socials
FOR SELECT
USING (is_admin(auth.uid()));