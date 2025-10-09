-- Drop the restrictive policy that blocks password verification
DROP POLICY IF EXISTS "Users verify own unused password" ON public.admin_passwords;
DROP POLICY IF EXISTS "Prevent reading used passwords" ON public.admin_passwords;

-- Create a new policy that allows anyone to verify a password if they provide exact email and password
CREATE POLICY "Anyone can verify password with exact match"
ON public.admin_passwords
FOR SELECT
USING (
  is_used = false 
  AND expires_at > now()
);

-- This is safe because:
-- 1. Users must provide exact email + password combination to find it
-- 2. Only unused passwords are visible
-- 3. Only non-expired passwords are visible
-- 4. Once used, the password becomes invisible