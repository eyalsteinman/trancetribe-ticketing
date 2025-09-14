-- Fix security vulnerability in contact_info table
-- Remove the overly permissive policy that allows everyone to view contact info

DROP POLICY IF EXISTS "Everyone can view contact info" ON public.contact_info;

-- Create a more secure policy that only allows authenticated users to view contact info
CREATE POLICY "Authenticated users can view contact info" 
ON public.contact_info 
FOR SELECT 
TO authenticated
USING (true);

-- Optionally, if you want even more restrictive access (admin-only), use this instead:
-- CREATE POLICY "Only admins can view contact info" 
-- ON public.contact_info 
-- FOR SELECT 
-- TO authenticated
-- USING (has_role(auth.uid(), 'admin'::app_role));