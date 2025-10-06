-- Make themasterbated@gmail.com a super admin
UPDATE admin_profiles 
SET is_super_admin = true, 
    admin_level = 'level3',
    allowed_tiles = ARRAY['manage-users', 'manage-parties', 'manage-productions', 'manage-bar-tabs', 'manage-qr', 'manage-messages', 'manage-games', 'manage-faq', 'manage-admins']
WHERE user_id = 'b5d66be9-6608-4ff8-8283-070b09dc251a';