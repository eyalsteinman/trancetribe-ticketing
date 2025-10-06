-- Fix 1: Restrict admin_passwords table to authenticated users only
DROP POLICY IF EXISTS "Anyone can verify unused admin passwords no recursion" ON public.admin_passwords;

CREATE POLICY "Authenticated users verify own admin password"
  ON public.admin_passwords
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND admin_email = auth.email()
    AND is_used = false 
    AND expires_at > now()
  );

-- Fix 2: Create helper functions to prevent tribes recursion
CREATE OR REPLACE FUNCTION public.user_tribe_ids(_user_id uuid)
RETURNS TABLE(tribe_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tribe_id 
  FROM tribe_members
  WHERE user_id = _user_id
$$;

-- Fix 3: Update is_super_admin to remove hardcoded email check
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_profiles ap
    WHERE ap.user_id = _user_id
      AND ap.is_super_admin = true
  )
$$;

-- Fix 4: Update lookup_friend_by_personal_code to require authentication
CREATE OR REPLACE FUNCTION public.lookup_friend_by_personal_code(_personal_code text)
RETURNS TABLE(user_id uuid, display_name text, first_name text, last_name text, personal_code text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    profiles.user_id,
    profiles.display_name,
    profiles.first_name,
    profiles.last_name,
    profiles.personal_code
  FROM profiles
  WHERE profiles.personal_code = _personal_code;
END;
$$;

-- Fix 5: Update tribes RLS policies to prevent recursion
DROP POLICY IF EXISTS "Users can view tribes they are members of" ON public.tribes;
DROP POLICY IF EXISTS "Users can view members of tribes they belong to" ON public.tribe_members;

-- Simple policy for tribe_members - users can view their own memberships
CREATE POLICY "Users view own tribe memberships"
  ON public.tribe_members 
  FOR SELECT
  USING (auth.uid() = user_id);

-- Updated tribes policy using helper function (no recursion)
CREATE POLICY "Users view their tribes"
  ON public.tribes 
  FOR SELECT
  USING (
    tribes.id IN (SELECT user_tribe_ids(auth.uid()))
    OR tribes.created_by = auth.uid()
  );

-- Fix 6: Update profiles admin access policy to be time-limited
DROP POLICY IF EXISTS "Admins can view profiles for their party attendees" ON public.profiles;

CREATE POLICY "Admins view attendees during active events"
  ON public.profiles 
  FOR SELECT
  USING (
    -- Users can view their own profile
    auth.uid() = user_id
    OR
    -- Super admins can view all
    is_super_admin(auth.uid())
    OR
    -- Admins can view attendees of their active/recent parties (7 days before to 30 days after)
    (
      has_role(auth.uid(), 'admin'::app_role)
      AND EXISTS (
        SELECT 1 FROM qr_codes qr
        JOIN parties p ON qr.party_id = p.id
        WHERE qr.user_id = profiles.user_id
        AND p.created_by = auth.uid()
        AND p.date >= CURRENT_DATE - INTERVAL '7 days'
        AND p.date <= CURRENT_DATE + INTERVAL '30 days'
      )
    )
  );