-- Remove the overly permissive policy that allows public viewing of all profiles
DROP POLICY "Allow viewing profiles for friends lookup" ON public.profiles;

-- Create a new policy that only allows users to view their own profile
-- Note: Admins can already view all profiles through the existing "Admins can view any profile" policy
-- No additional policy needed since the existing policies already cover legitimate use cases

-- Create a new function for secure friend lookup that only returns necessary data
CREATE OR REPLACE FUNCTION public.lookup_friend_by_personal_code(_personal_code text)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  first_name text,
  last_name text,
  personal_code text
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    profiles.user_id,
    profiles.display_name,
    profiles.first_name,
    profiles.last_name,
    profiles.personal_code
  FROM profiles
  WHERE profiles.personal_code = _personal_code;
$$;