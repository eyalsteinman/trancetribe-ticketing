-- Fix RLS policies for proper data isolation between admins
-- Each admin should only see their own data, super admins see everything

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Admins can manage all parties" ON public.parties;
DROP POLICY IF EXISTS "Admins can manage all productions" ON public.productions;

-- Profiles: Regular admins see only profiles of users with QR codes for their parties
CREATE POLICY "Admins can view profiles for their party attendees"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) AND (
    EXISTS (
      SELECT 1 FROM public.qr_codes qr
      JOIN public.parties p ON qr.party_id = p.id
      WHERE qr.user_id = profiles.user_id
      AND p.created_by = auth.uid()
    )
  )
);

-- Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
USING (is_super_admin(auth.uid()));

-- Super admins can update all profiles
CREATE POLICY "Super admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- QR Codes: Admins can only manage QR codes for their own parties
CREATE POLICY "Admins can manage QR codes for their parties"
ON public.qr_codes
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) AND (
    EXISTS (
      SELECT 1 FROM public.parties p
      WHERE p.id = qr_codes.party_id
      AND p.created_by = auth.uid()
    )
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND (
    EXISTS (
      SELECT 1 FROM public.parties p
      WHERE p.id = qr_codes.party_id
      AND p.created_by = auth.uid()
    )
  )
);

-- Super admins can manage all QR codes
CREATE POLICY "Super admins can manage all QR codes"
ON public.qr_codes
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Parties: Admins can only manage their own parties
CREATE POLICY "Admins can manage their own parties"
ON public.parties
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) AND created_by = auth.uid())
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND created_by = auth.uid());

-- Super admins can manage all parties
CREATE POLICY "Super admins can manage all parties"
ON public.parties
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Productions: Admins can only manage their own productions
CREATE POLICY "Admins can manage their own productions"
ON public.productions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) AND created_by = auth.uid())
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND created_by = auth.uid());

-- Super admins can manage all productions
CREATE POLICY "Super admins can manage all productions"
ON public.productions
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));