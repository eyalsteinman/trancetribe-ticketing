-- Fix conflicting RLS policies that prevent user creation
-- The issue is we have two INSERT policies on user_roles that conflict

-- Drop the conflicting policies
DROP POLICY IF EXISTS "System can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow direct admin signup" ON public.user_roles;

-- Create a single comprehensive INSERT policy that allows both system and authenticated user inserts
CREATE POLICY "Allow user role creation" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  -- Allow system/trigger to insert (when auth.uid() is NULL)
  auth.uid() IS NULL 
  OR 
  -- Allow authenticated users to insert their own roles
  (auth.uid() = user_id AND role IN ('user', 'admin'))
);

-- Ensure the profiles INSERT policy is correct
DROP POLICY IF EXISTS "Allow profile creation for signup" ON public.profiles;

CREATE POLICY "Allow profile creation for signup" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  -- Allow system/trigger to insert (when auth.uid() is NULL)
  auth.uid() IS NULL 
  OR 
  -- Allow authenticated users to insert their own profile
  auth.uid() = user_id
);