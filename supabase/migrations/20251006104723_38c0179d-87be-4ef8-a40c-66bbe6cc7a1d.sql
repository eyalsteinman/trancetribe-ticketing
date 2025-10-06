-- Fix data isolation: Each admin sees only their own data
-- Super admins see everything, sub-admins see their creator's data

-- Drop the overly permissive "Everyone can view parties" policy
DROP POLICY IF EXISTS "Everyone can view parties" ON public.parties;

-- Create strict SELECT policies for parties
CREATE POLICY "Regular admins view only own parties"
ON public.parties
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND NOT is_super_admin(auth.uid())
  AND created_by = auth.uid()
);

CREATE POLICY "Super admins view all parties"
ON public.parties
FOR SELECT
USING (is_super_admin(auth.uid()));

CREATE POLICY "Users view active parties"
ON public.parties
FOR SELECT
USING (
  NOT has_role(auth.uid(), 'admin'::app_role)
  AND is_active = true
);

-- Fix productions table - same issue
DROP POLICY IF EXISTS "Everyone can view productions" ON public.productions;

CREATE POLICY "Regular admins view only own productions"
ON public.productions
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND NOT is_super_admin(auth.uid())
  AND created_by = auth.uid()
);

CREATE POLICY "Super admins view all productions"
ON public.productions
FOR SELECT
USING (is_super_admin(auth.uid()));

CREATE POLICY "Users view all productions"
ON public.productions
FOR SELECT
USING (NOT has_role(auth.uid(), 'admin'::app_role));

-- Fix bar_tabs table
DROP POLICY IF EXISTS "Everyone can view active bar tabs" ON public.bar_tabs;

CREATE POLICY "Regular admins view only own bar tabs"
ON public.bar_tabs
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND NOT is_super_admin(auth.uid())
  AND created_by = auth.uid()
);

CREATE POLICY "Super admins view all bar tabs"
ON public.bar_tabs
FOR SELECT
USING (is_super_admin(auth.uid()));

CREATE POLICY "Users view active bar tabs"
ON public.bar_tabs
FOR SELECT
USING (
  NOT has_role(auth.uid(), 'admin'::app_role)
  AND is_active = true
);

-- Fix FAQs table
DROP POLICY IF EXISTS "Everyone can view FAQs" ON public.faqs;

CREATE POLICY "Regular admins view only own FAQs"
ON public.faqs
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND NOT is_super_admin(auth.uid())
  AND created_by = auth.uid()
);

CREATE POLICY "Super admins view all FAQs"
ON public.faqs
FOR SELECT
USING (is_super_admin(auth.uid()));

CREATE POLICY "Users view all FAQs"
ON public.faqs
FOR SELECT
USING (NOT has_role(auth.uid(), 'admin'::app_role));