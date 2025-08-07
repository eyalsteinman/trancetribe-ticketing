-- Fix infinite recursion in RLS policies by updating the has_role function
-- and creating a separate function for role checking that bypasses RLS

-- Create a security definer function that bypasses RLS for role checking
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'::app_role
  )
$$;

-- Update RLS policies on user_roles to use the new function and avoid recursion
DROP POLICY IF EXISTS "Admins can manage all roles (INSERT)" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles (UPDATE)" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles (DELETE)" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Create new policies that don't cause recursion
CREATE POLICY "Admins can manage all roles (INSERT)" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all roles (UPDATE)" 
ON public.user_roles 
FOR UPDATE 
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all roles (DELETE)" 
ON public.user_roles 
FOR DELETE 
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (public.is_admin(auth.uid()) OR (auth.uid() = user_id));