
-- Mark the admin password as used for es@lesartist.com since they already registered
UPDATE public.admin_passwords
SET is_used = true
WHERE admin_email = 'es@lesartist.com' 
  AND is_used = false;
