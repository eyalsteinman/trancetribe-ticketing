-- Fix infinite recursion by simplifying RLS policies

-- Drop problematic policies on profiles
DROP POLICY IF EXISTS "Admins can view profiles of users with QR codes for their parti" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can view all profiles direct" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can view all profiles" ON public.profiles;

-- Recreate simpler admin view policy for profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Drop and recreate QR codes policy without recursion
DROP POLICY IF EXISTS "Admins can manage QR codes for their parties" ON public.qr_codes;

CREATE POLICY "Admins can manage all QR codes"
ON public.qr_codes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Drop and recreate parties policies to avoid profile lookups
DROP POLICY IF EXISTS "Admins can manage their own parties" ON public.parties;
DROP POLICY IF EXISTS "Super admin can manage all parties" ON public.parties;

CREATE POLICY "Admins can manage all parties"
ON public.parties
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Drop and recreate productions policies
DROP POLICY IF EXISTS "Admins can manage their own productions" ON public.productions;
DROP POLICY IF EXISTS "Super admin can manage all productions" ON public.productions;

CREATE POLICY "Admins can manage all productions"
ON public.productions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));