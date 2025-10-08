-- Update handle_new_user function to auto-add users to Trance Tribe production
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  trance_tribe_id UUID;
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
  
  -- Automatically assign 'user' role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role);
  
  -- Find Trance Tribe production (created by eyalsteinman@gmail.com)
  SELECT p.id INTO trance_tribe_id
  FROM public.productions p
  JOIN public.profiles prof ON p.created_by = prof.user_id
  WHERE prof.email = 'eyalsteinman@gmail.com'
  AND LOWER(p.name) LIKE '%trance%tribe%'
  LIMIT 1;
  
  -- Auto-add user to Trance Tribe production if it exists
  IF trance_tribe_id IS NOT NULL THEN
    INSERT INTO public.production_followers (user_id, production_id)
    VALUES (NEW.id, trance_tribe_id)
    ON CONFLICT (user_id, production_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;