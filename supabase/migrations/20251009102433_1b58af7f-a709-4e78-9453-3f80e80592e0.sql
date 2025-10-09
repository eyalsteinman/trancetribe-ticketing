-- Drop the existing restrictive policy for admins viewing profiles
DROP POLICY IF EXISTS "Admins view approved attendees only" ON public.profiles;

-- Create a new policy that allows admins to view:
-- 1. Their own profile
-- 2. Profiles of users who have QR codes for their parties (any status)
-- 3. Profiles of users who are followers of their productions
CREATE POLICY "Admins can view their attendees and followers"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR is_super_admin(auth.uid())
  OR (
    has_role(auth.uid(), 'admin'::app_role) 
    AND (
      -- Users with QR codes for admin's parties
      EXISTS (
        SELECT 1
        FROM qr_codes qr
        JOIN parties p ON qr.party_id = p.id
        WHERE qr.user_id = profiles.user_id
          AND p.created_by = auth.uid()
      )
      OR
      -- Users who are followers of admin's productions
      EXISTS (
        SELECT 1
        FROM production_followers pf
        JOIN productions pr ON pf.production_id = pr.id
        WHERE pf.user_id = profiles.user_id
          AND pr.created_by = auth.uid()
      )
    )
  )
);