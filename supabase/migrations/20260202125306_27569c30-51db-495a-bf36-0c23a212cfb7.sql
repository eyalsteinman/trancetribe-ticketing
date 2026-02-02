-- Drop the policy that allows all authenticated users to view contact info
DROP POLICY IF EXISTS "Users view contact info" ON public.contact_info;

-- Add explicit admin-only SELECT policy for clarity
CREATE POLICY "Admins can view contact info"
ON public.contact_info
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));