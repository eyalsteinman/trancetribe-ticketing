-- Add allowed_tiles column to admin_passwords table
ALTER TABLE public.admin_passwords 
ADD COLUMN IF NOT EXISTS allowed_tiles text[] DEFAULT '{}';

-- Update the column comment
COMMENT ON COLUMN public.admin_passwords.allowed_tiles IS 'Array of tile IDs that the sub-admin is allowed to access';