-- Add first_name and last_name columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS email text;

-- Update existing profiles to split display_name into first and last names
UPDATE public.profiles 
SET 
  first_name = SPLIT_PART(display_name, ' ', 1),
  last_name = CASE 
    WHEN POSITION(' ' IN display_name) > 0 
    THEN SUBSTRING(display_name FROM POSITION(' ' IN display_name) + 1)
    ELSE ''
  END
WHERE first_name IS NULL AND display_name IS NOT NULL;

-- Update the handle_new_user function to use the new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Create profile with separate first/last name fields
  INSERT INTO public.profiles (user_id, display_name, first_name, last_name, email)
  VALUES (
    NEW.id, 
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name', 
      CONCAT(NEW.raw_user_meta_data ->> 'first_name', ' ', NEW.raw_user_meta_data ->> 'last_name'),
      'User'
    ),
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email
  );
  RETURN NEW;
END;
$function$;