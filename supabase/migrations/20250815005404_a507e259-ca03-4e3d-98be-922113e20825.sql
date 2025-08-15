-- Add personal_code to profiles table
ALTER TABLE public.profiles 
ADD COLUMN personal_code TEXT UNIQUE;

-- Create function to generate 6-digit unique code
CREATE OR REPLACE FUNCTION generate_personal_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        -- Generate 6-digit code
        code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE personal_code = code) INTO exists_check;
        
        -- If code doesn't exist, break the loop
        IF NOT exists_check THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing profiles to have personal codes
UPDATE public.profiles 
SET personal_code = generate_personal_code() 
WHERE personal_code IS NULL;

-- Create friends table
CREATE TABLE public.friends (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    friend_personal_code TEXT NOT NULL,
    friend_display_name TEXT NOT NULL,
    friend_first_name TEXT,
    friend_last_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, friend_personal_code)
);

-- Enable RLS on friends table
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- Create policies for friends table
CREATE POLICY "Users can view their own friends" 
ON public.friends 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own friends" 
ON public.friends 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own friends" 
ON public.friends 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own friends" 
ON public.friends 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for friends updated_at
CREATE TRIGGER update_friends_updated_at
BEFORE UPDATE ON public.friends
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update handle_new_user function to include personal_code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Create profile with separate first/last name fields and personal code
  INSERT INTO public.profiles (user_id, display_name, first_name, last_name, email, personal_code)
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
    generate_personal_code()
  );
  
  -- Automatically assign 'user' role to new users with explicit schema
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role);
  
  RETURN NEW;
END;
$function$;