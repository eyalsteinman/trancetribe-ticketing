-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Only system can insert roles" ON public.user_roles;

-- Create a new policy that allows admins to insert admin roles
CREATE POLICY "Admins can create admin roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND role = 'admin'::app_role
);

-- Also allow the system to insert roles (for initial admin creation)
CREATE POLICY "System can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() IS NULL);