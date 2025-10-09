
-- Create admin_profile for es@lesartist.com sub-admin
-- This user signed up with an admin password but their profile was not created
INSERT INTO public.admin_profiles (user_id, admin_level, is_super_admin, created_by, allowed_tiles)
SELECT 
  '1c26f0ec-db51-45b9-ae32-65e9a1cd3772'::uuid,
  'level1'::admin_level,
  false,
  'b5d66be9-6608-4ff8-8283-070b09dc251a'::uuid,
  ARRAY['guest-list', 'qr-scanner']::text[]
WHERE NOT EXISTS (
  SELECT 1 FROM public.admin_profiles 
  WHERE user_id = '1c26f0ec-db51-45b9-ae32-65e9a1cd3772'
);
