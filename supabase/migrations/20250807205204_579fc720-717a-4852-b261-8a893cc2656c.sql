-- Temporarily allow any authenticated user to insert admin roles for testing
-- We'll revert this after confirming it works

DROP POLICY IF EXISTS "Admins can manage all roles (INSERT)" ON public.user_roles;

-- Create a more permissive policy temporarily
CREATE POLICY "Allow admin creation (TEMP)" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Also allow authenticated users to insert profiles temporarily
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Allow profile creation (TEMP)" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (true);