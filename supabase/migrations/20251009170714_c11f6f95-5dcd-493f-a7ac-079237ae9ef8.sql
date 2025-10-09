
-- Add SELECT policy for regular admins to view sub-admins they created
CREATE POLICY "Regular admins can view their sub-admins"
ON public.admin_profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND created_by = auth.uid()
);
