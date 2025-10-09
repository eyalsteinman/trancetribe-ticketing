
-- Add role column to admin_profiles for custom sub-admin roles
ALTER TABLE public.admin_profiles 
ADD COLUMN IF NOT EXISTS role TEXT;
