-- Revert themasterbated@gmail.com to regular admin with proper tiles
UPDATE admin_profiles 
SET is_super_admin = false, 
    admin_level = 'level2',
    allowed_tiles = ARRAY['manage-parties', 'manage-qr', 'manage-messages']
WHERE user_id = 'b5d66be9-6608-4ff8-8283-070b09dc251a';