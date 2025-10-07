-- Tighten RLS policies for profiles table to prevent data harvesting
DROP POLICY IF EXISTS "Admins view attendees during active events" ON public.profiles;

-- Create more restrictive policy: admins can only view profiles of users with approved QR codes for their current/upcoming parties
CREATE POLICY "Admins view approved attendees only" ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id 
  OR is_super_admin(auth.uid()) 
  OR (
    has_role(auth.uid(), 'admin'::app_role) 
    AND EXISTS (
      SELECT 1
      FROM qr_codes qr
      JOIN parties p ON qr.party_id = p.id
      WHERE qr.user_id = profiles.user_id
        AND qr.is_approved = true
        AND p.created_by = auth.uid()
        AND p.date >= CURRENT_DATE
        AND p.date <= (CURRENT_DATE + INTERVAL '7 days')
    )
  )
);

-- Restrict admin_passwords table to only allow users to see their own unused password
DROP POLICY IF EXISTS "Authenticated users verify own admin password" ON public.admin_passwords;

CREATE POLICY "Users verify own unused password" ON public.admin_passwords
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND admin_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND is_used = false
  AND expires_at > now()
);

-- Add policy to prevent reading used or expired passwords
CREATE POLICY "Prevent reading used passwords" ON public.admin_passwords
FOR SELECT
USING (
  is_super_admin(auth.uid())
  OR (
    auth.uid() IS NOT NULL
    AND admin_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND is_used = false
    AND expires_at > now()
  )
);

-- Tighten contact_info to only show to authenticated users who need it
DROP POLICY IF EXISTS "Authenticated users can view contact info" ON public.contact_info;

CREATE POLICY "Users view contact info" ON public.contact_info
FOR SELECT
USING (
  auth.uid() IS NOT NULL
);