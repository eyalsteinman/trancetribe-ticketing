-- Fix infinite recursion in RLS policies by creating security definer functions

-- Function to check if user is admin (replaces recursive queries)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'::public.app_role
  )
$$;

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is super admin (level3) or has no admin profile (defaults to super admin)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = 'admin'::public.app_role
      AND (
        EXISTS (
          SELECT 1 FROM public.admin_profiles ap 
          WHERE ap.user_id = _user_id AND ap.admin_level = 'level3'::admin_level
        )
        OR NOT EXISTS (
          SELECT 1 FROM public.admin_profiles ap2 
          WHERE ap2.user_id = _user_id
        )
      )
  )
$$;

-- Function to check if user is tribe owner
CREATE OR REPLACE FUNCTION public.is_tribe_owner(_user_id uuid, _tribe_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tribe_members
    WHERE tribe_id = _tribe_id
      AND user_id = _user_id
      AND role = 'owner'
  )
$$;

-- Drop and recreate admin_profiles policies
DROP POLICY IF EXISTS "Super admins can manage all admin profiles" ON public.admin_profiles;

CREATE POLICY "Super admins can manage all admin profiles"
ON public.admin_profiles
FOR ALL
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- Drop and recreate tribes policies  
DROP POLICY IF EXISTS "Tribe owners can delete their tribes" ON public.tribes;
DROP POLICY IF EXISTS "Tribe owners can update their tribes" ON public.tribes;

CREATE POLICY "Tribe owners can delete their tribes"
ON public.tribes
FOR DELETE
USING (public.is_tribe_owner(auth.uid(), id));

CREATE POLICY "Tribe owners can update their tribes"
ON public.tribes
FOR UPDATE
USING (public.is_tribe_owner(auth.uid(), id));

-- Drop and recreate tribe_members policies
DROP POLICY IF EXISTS "Tribe owners can add members" ON public.tribe_members;
DROP POLICY IF EXISTS "Tribe owners can remove members" ON public.tribe_members;

CREATE POLICY "Tribe owners can add members"
ON public.tribe_members
FOR INSERT
WITH CHECK (
  public.is_tribe_owner(auth.uid(), tribe_id) OR 
  (auth.uid() = user_id AND role = 'owner')
);

CREATE POLICY "Tribe owners can remove members"
ON public.tribe_members
FOR DELETE
USING (
  public.is_tribe_owner(auth.uid(), tribe_id) OR 
  auth.uid() = user_id
);