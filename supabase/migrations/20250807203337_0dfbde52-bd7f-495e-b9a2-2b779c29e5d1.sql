-- Update RLS policies for user_roles to allow admins to manage all roles
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can create admin roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete admin roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update admin roles" ON public.user_roles;

-- Create new policies that allow admins to manage all roles
CREATE POLICY "Admins can manage all roles (INSERT)" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all roles (UPDATE)" 
ON public.user_roles 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all roles (DELETE)" 
ON public.user_roles 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));