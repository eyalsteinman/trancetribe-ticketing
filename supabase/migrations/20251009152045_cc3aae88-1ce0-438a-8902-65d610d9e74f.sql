-- Allow regular admins to create sub-admin profiles they manage
CREATE POLICY "Regular admins can create sub-admin profiles"
ON public.admin_profiles
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND created_by = auth.uid()
  AND NOT is_super_admin(auth.uid())
);

-- Allow regular admins to manage sub-admins they created
CREATE POLICY "Regular admins can manage their sub-admins"
ON public.admin_profiles
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND created_by = auth.uid()
);

-- Allow regular admins to delete sub-admins they created
CREATE POLICY "Regular admins can delete their sub-admins"
ON public.admin_profiles
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND created_by = auth.uid()
);