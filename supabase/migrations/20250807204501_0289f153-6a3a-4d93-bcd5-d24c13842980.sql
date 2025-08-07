-- Recreate the trigger and fix the user creation flow
-- First, ensure the trigger function exists and works properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Create profile with separate first/last name fields
  INSERT INTO public.profiles (user_id, display_name, first_name, last_name, email)
  VALUES (
    NEW.id, 
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name', 
      CONCAT(NEW.raw_user_meta_data ->> 'first_name', ' ', NEW.raw_user_meta_data ->> 'last_name'),
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email
  );
  
  -- Automatically assign 'user' role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role);
  
  RETURN NEW;
END;
$$;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger on the auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure the "System can insert roles" policy allows the trigger to work
DROP POLICY IF EXISTS "System can insert roles" ON public.user_roles;

CREATE POLICY "System can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() IS NULL);

-- Also ensure system can insert profiles
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;

CREATE POLICY "System can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() IS NULL);