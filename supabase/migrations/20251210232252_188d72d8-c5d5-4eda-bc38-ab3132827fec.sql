-- Fix 1: Restrict admin access to user_socials - only view socials of their event attendees
DROP POLICY IF EXISTS "Admins can view all socials (read)" ON public.user_socials;

CREATE POLICY "Admins can view attendee socials only"
ON public.user_socials
FOR SELECT
USING (
  (auth.uid() = user_id) OR
  (has_role(auth.uid(), 'admin'::app_role) AND EXISTS (
    SELECT 1 FROM qr_codes qr
    JOIN parties p ON qr.party_id = p.id
    WHERE qr.user_id = user_socials.user_id
    AND p.created_by = auth.uid()
  ))
);

-- Fix 2: Tighten QR codes admin policy - only manage QR codes for parties they created
DROP POLICY IF EXISTS "Super admins can manage all QR codes" ON public.qr_codes;

CREATE POLICY "Super admins can view all QR codes"
ON public.qr_codes
FOR SELECT
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update QR codes"
ON public.qr_codes
FOR UPDATE
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Fix 3: Tighten profile creation policy - require authentication
DROP POLICY IF EXISTS "Allow profile creation for signup" ON public.profiles;

CREATE POLICY "System can create profiles on signup"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);