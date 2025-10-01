-- Update RLS policies for admin data isolation

-- Update parties table RLS policies for admin isolation
DROP POLICY IF EXISTS "Admins can manage their own parties" ON public.parties;
CREATE POLICY "Admins can manage their own parties" ON public.parties
FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) AND (
    created_by = auth.uid() OR 
    is_super_admin(auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND (
    created_by = auth.uid() OR 
    is_super_admin(auth.uid())
  )
);

-- Update productions table RLS policies for admin isolation
DROP POLICY IF EXISTS "Admins can manage their own productions" ON public.productions;
CREATE POLICY "Admins can manage their own productions" ON public.productions
FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) AND (
    created_by = auth.uid() OR 
    is_super_admin(auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND (
    created_by = auth.uid() OR 
    is_super_admin(auth.uid())
  )
);

-- Update bar_tabs table RLS policies for admin isolation
DROP POLICY IF EXISTS "Admins can manage their own bar tabs" ON public.bar_tabs;
CREATE POLICY "Admins can manage their own bar tabs" ON public.bar_tabs
FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) AND (
    created_by = auth.uid() OR 
    is_super_admin(auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND (
    created_by = auth.uid() OR 
    is_super_admin(auth.uid())
  )
);

-- Update messages table RLS policies for admin isolation
DROP POLICY IF EXISTS "Admins can manage their own messages" ON public.messages;
CREATE POLICY "Admins can manage their own messages" ON public.messages
FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) AND (
    created_by = auth.uid() OR 
    is_super_admin(auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND (
    created_by = auth.uid() OR 
    is_super_admin(auth.uid())
  )
);

-- Update qr_codes table RLS policies for admin isolation  
DROP POLICY IF EXISTS "Admins can manage QR codes for their parties" ON public.qr_codes;
CREATE POLICY "Admins can manage QR codes for their parties" ON public.qr_codes
FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) AND (
    EXISTS (
      SELECT 1 FROM parties 
      WHERE parties.id = qr_codes.party_id 
      AND (parties.created_by = auth.uid() OR is_super_admin(auth.uid()))
    )
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND (
    EXISTS (
      SELECT 1 FROM parties 
      WHERE parties.id = qr_codes.party_id 
      AND (parties.created_by = auth.uid() OR is_super_admin(auth.uid()))
    )
  )
);

-- Update faqs table RLS policies for admin isolation
DROP POLICY IF EXISTS "Admins can manage their own FAQs" ON public.faqs;
CREATE POLICY "Admins can manage their own FAQs" ON public.faqs
FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) AND (
    created_by = auth.uid() OR 
    is_super_admin(auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND (
    created_by = auth.uid() OR 
    is_super_admin(auth.uid())
  )
);

-- Add policy for profiles table to allow super admin access to all profiles
DROP POLICY IF EXISTS "Super admin can view all profiles" ON public.profiles;
CREATE POLICY "Super admin can view all profiles" ON public.profiles
FOR SELECT USING (is_super_admin(auth.uid()));

-- Update admin_profiles to allow super admin access
DROP POLICY IF EXISTS "Super admins can view all admin profiles" ON public.admin_profiles;
CREATE POLICY "Super admins can view all admin profiles" ON public.admin_profiles
FOR SELECT USING (is_super_admin(auth.uid()));