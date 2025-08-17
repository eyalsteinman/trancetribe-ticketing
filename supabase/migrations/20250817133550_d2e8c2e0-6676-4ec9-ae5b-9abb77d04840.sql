-- Add phone_number column to profiles table
ALTER TABLE public.profiles ADD COLUMN phone_number TEXT;

-- Update the handle_new_user function to include phone number
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile with separate first/last name fields, personal code, and phone number
  INSERT INTO public.profiles (user_id, display_name, first_name, last_name, email, personal_code, phone_number)
  VALUES (
    NEW.id, 
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name', 
      CONCAT(NEW.raw_user_meta_data ->> 'first_name', ' ', NEW.raw_user_meta_data ->> 'last_name'),
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email,
    generate_personal_code(),
    NEW.raw_user_meta_data ->> 'phone_number'
  );
  
  -- Automatically assign 'user' role to new users with explicit schema
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role);
  
  RETURN NEW;
END;
$function$;