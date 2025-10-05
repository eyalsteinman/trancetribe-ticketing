-- Fix infinite recursion in RLS policies

-- Drop problematic policies
DROP POLICY IF EXISTS "Admins can view their party attendees" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can verify unused admin passwords" ON public.admin_passwords;

-- Create better policies for profiles that don't cause recursion
CREATE POLICY "Admins can view profiles of users with QR codes for their parties"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) AND 
  EXISTS (
    SELECT 1 FROM public.qr_codes qr
    INNER JOIN public.parties p ON p.id = qr.party_id
    WHERE qr.user_id = profiles.user_id 
    AND p.created_by = auth.uid()
  )
);

-- Super admin can view all profiles without recursion check
CREATE POLICY "Super admin can view all profiles direct"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_profiles ap
    WHERE ap.user_id = auth.uid() 
    AND ap.is_super_admin = true
  )
);

-- Fix admin_passwords policy to avoid profile lookup
CREATE POLICY "Anyone can verify unused admin passwords no recursion"
ON public.admin_passwords
FOR SELECT
USING (
  is_used = false AND expires_at > now()
);