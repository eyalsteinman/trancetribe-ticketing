-- Add admin role to eyalkoo@yahoo.com
INSERT INTO public.user_roles (user_id, role)
SELECT '9d1629c6-fed1-494c-96bf-fe8719674c6b', 'admin'::public.app_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = '9d1629c6-fed1-494c-96bf-fe8719674c6b' 
  AND role = 'admin'::public.app_role
);