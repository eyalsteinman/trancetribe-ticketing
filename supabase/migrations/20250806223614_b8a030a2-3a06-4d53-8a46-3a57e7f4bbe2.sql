-- Disable email confirmation requirement
-- Note: This setting is usually managed in the Supabase dashboard under Authentication > Settings
-- But we can update the auth.config table if it exists, or create a function to handle this

-- First, let's check the current auth settings
-- Since we can't directly modify auth settings via SQL, we'll update our application logic
-- to handle users without email confirmation

-- Update the profiles trigger to ensure it works without email confirmation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Create profile immediately without waiting for email confirmation
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id, 
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name', 
      NEW.raw_user_meta_data ->> 'name', 
      CONCAT(NEW.raw_user_meta_data ->> 'first_name', ' ', NEW.raw_user_meta_data ->> 'last_name'),
      'User'
    )
  );
  RETURN NEW;
END;
$function$;

-- Make sure the trigger exists and is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();