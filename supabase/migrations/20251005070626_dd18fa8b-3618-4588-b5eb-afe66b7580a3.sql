-- Fix is_super_admin function with CASCADE to replace it
DROP FUNCTION IF EXISTS public.is_super_admin(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_profiles ap
    WHERE ap.user_id = _user_id
      AND ap.is_super_admin = true
  )
$$;

-- Recreate policies that were dropped
CREATE POLICY "Super admins can manage all admin profiles"
ON public.admin_profiles
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can view all admin profiles"
ON public.admin_profiles
FOR SELECT
USING (is_super_admin(auth.uid()));

CREATE POLICY "Admins can manage QR codes for their parties"
ON public.qr_codes
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) AND
  EXISTS (
    SELECT 1 FROM parties
    WHERE parties.id = qr_codes.party_id
    AND (parties.created_by = auth.uid() OR is_super_admin(auth.uid()))
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND
  EXISTS (
    SELECT 1 FROM parties
    WHERE parties.id = qr_codes.party_id
    AND (parties.created_by = auth.uid() OR is_super_admin(auth.uid()))
  )
);

CREATE POLICY "Super admin can view all profiles"
ON public.profiles
FOR SELECT
USING (is_super_admin(auth.uid()));