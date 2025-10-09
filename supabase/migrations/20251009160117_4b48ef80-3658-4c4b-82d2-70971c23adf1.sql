-- Allow regular admins to view passwords they created
CREATE POLICY "Regular admins can view passwords they created"
ON public.admin_passwords
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND created_by = auth.uid()
);