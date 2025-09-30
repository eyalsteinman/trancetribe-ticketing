-- Create super admin functionality and admin isolation

-- First, create a table to store unique admin passwords
CREATE TABLE public.admin_passwords (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_email text NOT NULL UNIQUE,
  unique_password text NOT NULL,
  is_used boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days')
);

-- Enable RLS on admin_passwords
ALTER TABLE public.admin_passwords ENABLE ROW LEVEL SECURITY;

-- Only super admin can manage admin passwords
CREATE POLICY "Super admin can manage admin passwords"
ON public.admin_passwords
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND email = 'eyalsteinman@gmail.com'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND email = 'eyalsteinman@gmail.com'
  )
);

-- Update admin_profiles to include super admin designation
ALTER TABLE public.admin_profiles 
ADD COLUMN is_super_admin boolean DEFAULT false;

-- Make eyalsteinman@gmail.com a super admin if they exist
DO $$
DECLARE
    super_admin_id uuid;
BEGIN
    -- Check if user exists with this email
    SELECT user_id INTO super_admin_id 
    FROM public.profiles 
    WHERE email = 'eyalsteinman@gmail.com';
    
    IF super_admin_id IS NOT NULL THEN
        -- Insert or update admin profile for super admin
        INSERT INTO public.admin_profiles (user_id, admin_level, is_super_admin, allowed_tiles)
        VALUES (
            super_admin_id, 
            'level3'::admin_level, 
            true,
            ARRAY['manage-users', 'manage-parties', 'manage-productions', 'manage-bar-tabs', 'manage-qr', 'manage-messages', 'manage-games', 'manage-faq', 'manage-admins']
        )
        ON CONFLICT (user_id) DO UPDATE SET
            admin_level = 'level3'::admin_level,
            is_super_admin = true,
            allowed_tiles = ARRAY['manage-users', 'manage-parties', 'manage-productions', 'manage-bar-tabs', 'manage-qr', 'manage-messages', 'manage-games', 'manage-faq', 'manage-admins'];
        
        -- Ensure they have admin role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (super_admin_id, 'admin'::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;

-- Update RLS policies for admin isolation

-- Parties: Admins can only see their own parties (except super admin)
DROP POLICY IF EXISTS "Admins can create parties" ON public.parties;
DROP POLICY IF EXISTS "Admins can update parties" ON public.parties;
DROP POLICY IF EXISTS "Admins can delete parties" ON public.parties;

CREATE POLICY "Super admin can manage all parties"
ON public.parties
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.admin_profiles ap ON p.user_id = ap.user_id
    WHERE p.user_id = auth.uid() 
    AND ap.is_super_admin = true
  )
);

CREATE POLICY "Admins can manage their own parties"
ON public.parties
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND created_by = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND created_by = auth.uid()
);

-- Productions: Admin isolation (except super admin)
DROP POLICY IF EXISTS "Admins can insert productions" ON public.productions;
DROP POLICY IF EXISTS "Admins can update their productions" ON public.productions;
DROP POLICY IF EXISTS "Admins can delete their productions" ON public.productions;

CREATE POLICY "Super admin can manage all productions"
ON public.productions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.admin_profiles ap ON p.user_id = ap.user_id
    WHERE p.user_id = auth.uid() 
    AND ap.is_super_admin = true
  )
);

CREATE POLICY "Admins can manage their own productions"
ON public.productions
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND created_by = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND created_by = auth.uid()
);

-- Bar tabs: Admin isolation (except super admin)
DROP POLICY IF EXISTS "Admins can manage bar tabs" ON public.bar_tabs;

CREATE POLICY "Super admin can manage all bar tabs"
ON public.bar_tabs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.admin_profiles ap ON p.user_id = ap.user_id
    WHERE p.user_id = auth.uid() 
    AND ap.is_super_admin = true
  )
);

CREATE POLICY "Admins can manage their own bar tabs"
ON public.bar_tabs
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND created_by = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND created_by = auth.uid()
);

-- Messages: Admin isolation (except super admin)
DROP POLICY IF EXISTS "Admins can create messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can update their messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;

CREATE POLICY "Super admin can manage all messages"
ON public.messages
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.admin_profiles ap ON p.user_id = ap.user_id
    WHERE p.user_id = auth.uid() 
    AND ap.is_super_admin = true
  )
);

CREATE POLICY "Admins can manage their own messages"
ON public.messages
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND created_by = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND created_by = auth.uid()
);

-- QR codes: Admins can only manage QR codes for their parties
DROP POLICY IF EXISTS "Users can update their own QR codes or admins can scan" ON public.qr_codes;

CREATE POLICY "Users can update their own QR codes"
ON public.qr_codes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Super admin can manage all QR codes"
ON public.qr_codes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.admin_profiles ap ON p.user_id = ap.user_id
    WHERE p.user_id = auth.uid() 
    AND ap.is_super_admin = true
  )
);

CREATE POLICY "Admins can manage QR codes for their parties"
ON public.qr_codes
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND EXISTS (
    SELECT 1 FROM public.parties 
    WHERE id = party_id 
    AND created_by = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND EXISTS (
    SELECT 1 FROM public.parties 
    WHERE id = party_id 
    AND created_by = auth.uid()
  )
);

-- FAQs: Admin isolation (except super admin)
DROP POLICY IF EXISTS "Admins can manage FAQs" ON public.faqs;

CREATE POLICY "Super admin can manage all FAQs"
ON public.faqs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.admin_profiles ap ON p.user_id = ap.user_id
    WHERE p.user_id = auth.uid() 
    AND ap.is_super_admin = true
  )
);

CREATE POLICY "Admins can manage their own FAQs"
ON public.faqs
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND created_by = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND created_by = auth.uid()
);

-- Update is_super_admin function
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.admin_profiles ap ON p.user_id = ap.user_id
    WHERE p.user_id = _user_id
      AND ap.is_super_admin = true
      AND p.email = 'eyalsteinman@gmail.com'
  )
$$;