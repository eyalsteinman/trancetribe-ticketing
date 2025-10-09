-- Drop the unique constraint on admin_email to allow multiple admins to create passwords for the same email
-- and to allow regenerating passwords for the same email
ALTER TABLE public.admin_passwords 
DROP CONSTRAINT IF EXISTS admin_passwords_admin_email_key;