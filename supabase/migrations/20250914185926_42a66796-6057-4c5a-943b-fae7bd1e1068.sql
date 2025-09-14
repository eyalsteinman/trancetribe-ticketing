-- Fix security vulnerability in contact_info table RLS policy
-- Replace the overly permissive "Everyone can view contact info" policy

-- First drop the existing policy
DROP POLICY "Everyone can view contact info" ON public.contact_info;

-- Create a secure replacement policy that requires authentication
CREATE POLICY "Authenticated users can view contact info" 
ON public.contact_info 
FOR SELECT 
TO authenticated
USING (true);