-- Fix admin registration issues by updating RLS policies

-- 1. Fix profiles table policies - allow anyone to create profiles during signup
DROP POLICY IF EXISTS "Allow profile creation (TEMP)" ON public.profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Allow profile creation for signup" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() IS NULL OR auth.uid() = user_id);

-- 2. Fix user_roles table policies - allow admin creation and admin management
DROP POLICY IF EXISTS "Allow admin creation (TEMP)" ON public.user_roles;
DROP POLICY IF EXISTS "System can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles (INSERT)" ON public.user_roles;

-- Allow system (trigger) to insert roles
CREATE POLICY "System can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() IS NULL);

-- Allow any authenticated user to create admin roles (for direct admin signup)
CREATE POLICY "Allow direct admin signup" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (role IN ('user', 'admin'));

-- Allow existing admins to manage all roles
CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 3. Ensure the trigger is working properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();