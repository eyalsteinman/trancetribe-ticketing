-- Allow regular admins to create sub-admin passwords
CREATE POLICY "Regular admins can create sub-admin passwords"
ON public.admin_passwords
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND created_by = auth.uid()
  AND NOT is_super_admin(auth.uid())
);