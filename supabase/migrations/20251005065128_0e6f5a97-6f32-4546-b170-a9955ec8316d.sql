-- Remove admin role from eyalkoo@yahoo.com (should be regular user only)
DELETE FROM public.user_roles 
WHERE user_id = '9d1629c6-fed1-494c-96bf-fe8719674c6b' 
AND role = 'admin'::public.app_role;

-- Ensure eyalsteinman@gmail.com has super admin status
UPDATE public.admin_profiles 
SET is_super_admin = true 
WHERE user_id = (SELECT user_id FROM public.profiles WHERE email = 'eyalsteinman@gmail.com');

-- Ensure themasterbated@gmail.com has admin role
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::public.app_role 
FROM public.profiles 
WHERE email = 'themasterbated@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = profiles.user_id 
  AND ur.role = 'admin'::public.app_role
);

-- Create admin profile for themasterbated@gmail.com if not exists
INSERT INTO public.admin_profiles (user_id, admin_level, allowed_tiles)
SELECT user_id, 'level1'::public.admin_level, ARRAY[]::text[]
FROM public.profiles 
WHERE email = 'themasterbated@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.admin_profiles ap
  WHERE ap.user_id = profiles.user_id
);