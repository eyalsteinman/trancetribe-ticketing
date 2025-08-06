-- Add DELETE policy for user_roles to allow admins to delete admin roles
CREATE POLICY "Admins can delete admin roles" 
ON public.user_roles 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role) AND role = 'admin'::app_role
);

-- Add UPDATE policy for user_roles to allow admins to update roles if needed
CREATE POLICY "Admins can update admin roles" 
ON public.user_roles 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) AND role = 'admin'::app_role
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND role = 'admin'::app_role
);

-- Check if there are any unique constraints that might prevent multiple admins
-- The table should allow multiple users to have admin role, but prevent duplicate role assignments for the same user
-- Let's ensure the unique constraint is correct (should be on user_id, role combination)
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);