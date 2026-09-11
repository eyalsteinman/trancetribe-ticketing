-- 1. Fix user_roles INSERT null-auth bypass
DROP POLICY IF EXISTS "Allow user role creation" ON public.user_roles;
CREATE POLICY "Allow user role creation"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND role = 'user'::public.app_role);

-- 2. Helper: the acting admin's own allowed tiles
CREATE OR REPLACE FUNCTION public.admin_allowed_tiles(_user_id uuid)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT allowed_tiles FROM public.admin_profiles WHERE user_id = _user_id LIMIT 1),
    '{}'::text[]
  )
$$;

REVOKE ALL ON FUNCTION public.admin_allowed_tiles(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_allowed_tiles(uuid) TO authenticated, service_role;

-- 3. admin_profiles: prevent super-admin escalation and tile escalation
DROP POLICY IF EXISTS "Regular admins can create sub-admin profiles" ON public.admin_profiles;
CREATE POLICY "Regular admins can create sub-admin profiles"
ON public.admin_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::public.app_role)
  AND created_by = auth.uid()
  AND NOT is_super_admin(auth.uid())
  AND user_id <> auth.uid()
  AND COALESCE(is_super_admin, false) = false
  AND allowed_tiles <@ public.admin_allowed_tiles(auth.uid())
);

DROP POLICY IF EXISTS "Regular admins can manage their sub-admins" ON public.admin_profiles;
CREATE POLICY "Regular admins can manage their sub-admins"
ON public.admin_profiles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::public.app_role)
  AND created_by = auth.uid()
  AND NOT is_super_admin(auth.uid())
  AND user_id <> auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::public.app_role)
  AND created_by = auth.uid()
  AND NOT is_super_admin(auth.uid())
  AND user_id <> auth.uid()
  AND COALESCE(is_super_admin, false) = false
  AND allowed_tiles <@ public.admin_allowed_tiles(auth.uid())
);

-- 4. admin_passwords: constrain granted tiles on insert and update
DROP POLICY IF EXISTS "Regular admins can create sub-admin passwords" ON public.admin_passwords;
CREATE POLICY "Regular admins can create sub-admin passwords"
ON public.admin_passwords
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::public.app_role)
  AND created_by = auth.uid()
  AND NOT is_super_admin(auth.uid())
  AND COALESCE(allowed_tiles, '{}'::text[]) <@ public.admin_allowed_tiles(auth.uid())
);

DROP POLICY IF EXISTS "Regular admins can update passwords they created" ON public.admin_passwords;
CREATE POLICY "Regular admins can update passwords they created"
ON public.admin_passwords
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::public.app_role)
  AND created_by = auth.uid()
  AND NOT is_super_admin(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::public.app_role)
  AND created_by = auth.uid()
  AND NOT is_super_admin(auth.uid())
  AND COALESCE(allowed_tiles, '{}'::text[]) <@ public.admin_allowed_tiles(auth.uid())
);

-- 5. admin_passwords: store hashed invite codes instead of plaintext
ALTER TABLE public.admin_passwords
  ADD COLUMN IF NOT EXISTS password_hash text;

CREATE OR REPLACE FUNCTION public.hash_admin_password()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.unique_password IS NOT NULL AND NEW.unique_password <> '' THEN
    NEW.password_hash := extensions.crypt(NEW.unique_password, extensions.gen_salt('bf'));
    NEW.unique_password := '';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.hash_admin_password() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS hash_admin_password_trigger ON public.admin_passwords;
CREATE TRIGGER hash_admin_password_trigger
BEFORE INSERT OR UPDATE OF unique_password ON public.admin_passwords
FOR EACH ROW EXECUTE FUNCTION public.hash_admin_password();

-- Migrate existing plaintext values to hashes
UPDATE public.admin_passwords
SET password_hash = extensions.crypt(unique_password, extensions.gen_salt('bf')),
    unique_password = ''
WHERE unique_password IS NOT NULL AND unique_password <> '';

-- 6. Lock down SECURITY DEFINER helpers that should not be callable from the API
REVOKE ALL ON FUNCTION public.generate_personal_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.expire_old_offers() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_free_ticket_acceptance() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_friend_acceptance() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_friend_addition() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_offer_in_tribes() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_ticket_sold_count() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_party_review() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.lookup_friend_by_personal_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lookup_friend_by_personal_code(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.expire_old_offers() TO service_role;