-- Create admin levels enum
CREATE TYPE public.admin_level AS ENUM ('level1', 'level2', 'level3');

-- Create admin profiles table to store admin level and tile permissions
CREATE TABLE public.admin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_level admin_level NOT NULL DEFAULT 'level1',
  allowed_tiles TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_profiles
CREATE POLICY "Super admins can manage all admin profiles"
ON public.admin_profiles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
    AND auth.uid() IN (
      SELECT user_id FROM public.admin_profiles 
      WHERE admin_level = 'level3'
      OR auth.uid() NOT IN (SELECT user_id FROM public.admin_profiles)
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
    AND auth.uid() IN (
      SELECT user_id FROM public.admin_profiles 
      WHERE admin_level = 'level3'
      OR auth.uid() NOT IN (SELECT user_id FROM public.admin_profiles)
    )
  )
);

CREATE POLICY "Admins can view their own profile"
ON public.admin_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Update parties table to support optional vs obligatory social requirements
ALTER TABLE public.parties 
ADD COLUMN optional_socials TEXT[] DEFAULT '{}',
ADD COLUMN obligatory_socials TEXT[] DEFAULT '{}';

-- Copy existing required_socials to obligatory_socials
UPDATE public.parties 
SET obligatory_socials = required_socials
WHERE required_socials IS NOT NULL;

-- Create trigger for updated_at
CREATE TRIGGER update_admin_profiles_updated_at
BEFORE UPDATE ON public.admin_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();