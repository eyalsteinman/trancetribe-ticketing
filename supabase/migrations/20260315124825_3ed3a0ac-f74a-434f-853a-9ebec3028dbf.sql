
-- ============================================================
-- BUG FIX 1: CRITICAL PRIVILEGE ESCALATION
-- user_roles INSERT policy allows ANY user to self-assign 'admin' role
-- Fix: only allow self-assigning 'user' role (admin role assignment via edge function)
-- ============================================================
DROP POLICY IF EXISTS "Allow user role creation" ON public.user_roles;
CREATE POLICY "Allow user role creation"
  ON public.user_roles
  FOR INSERT
  TO public
  WITH CHECK (
    (auth.uid() IS NULL)  -- for trigger-based inserts (handle_new_user runs as SECURITY DEFINER)
    OR (auth.uid() = user_id AND role = 'user'::app_role)
  );

-- ============================================================
-- BUG FIX 2: INSECURE PUBLIC ACCESS TO ADMIN PASSWORDS
-- This policy lets anyone enumerate unused/valid admin passwords
-- Verification is now handled server-side via edge function
-- ============================================================
DROP POLICY IF EXISTS "Anyone can verify password with exact match" ON public.admin_passwords;

-- ============================================================
-- BUG FIX 3: contact_info SELECT policy too broad
-- Any admin can see ALL admin contact info. Fix: own records only
-- ============================================================
DROP POLICY IF EXISTS "Admins can view contact info" ON public.contact_info;
CREATE POLICY "Admins can view own contact info"
  ON public.contact_info
  FOR SELECT
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role) AND created_by = auth.uid());

-- Super admins can still see all
CREATE POLICY "Super admins can view all contact info"
  ON public.contact_info
  FOR SELECT
  TO public
  USING (is_super_admin(auth.uid()));
