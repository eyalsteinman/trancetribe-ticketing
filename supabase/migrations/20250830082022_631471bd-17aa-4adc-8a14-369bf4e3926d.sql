-- Fix security vulnerability: Restrict profiles table access
-- First create the secure policies with different names
CREATE POLICY "Users can view own profile only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow admins to view all profiles for administrative purposes  
CREATE POLICY "Admins can view any profile" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Now drop the insecure policy
DROP POLICY "Users can view all profiles" ON public.profiles;