-- Clear allowed_tiles for regular admins who are not sub-admins
-- Regular admins (created_by is NULL) should have empty allowed_tiles to indicate full access
UPDATE public.admin_profiles
SET allowed_tiles = '{}'
WHERE created_by IS NULL 
  AND is_super_admin = false
  AND user_id = 'b5d66be9-6608-4ff8-8283-070b09dc251a';