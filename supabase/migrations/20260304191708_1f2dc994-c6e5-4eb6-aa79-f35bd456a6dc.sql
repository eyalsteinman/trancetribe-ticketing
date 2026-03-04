
-- 1. FIX DUPLICATE TRIGGER: Remove the duplicate tribe notification trigger
-- Both on_admin_offer_created (notify_offer_in_tribes) and trigger_notify_tribe_with_offer (notify_tribe_with_offer) fire on admin_offers INSERT
-- Keep notify_offer_in_tribes (it also sends a direct message), drop the duplicate
DROP TRIGGER IF EXISTS trigger_notify_tribe_with_offer ON public.admin_offers;
DROP FUNCTION IF EXISTS public.notify_tribe_with_offer();

-- 2. FIX handle_friend_acceptance: Only trigger friend addition when replying to an actual friend request
-- Currently ANY "yes" DM to anyone triggers friend addition
CREATE OR REPLACE FUNCTION public.handle_friend_acceptance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    sender_personal_code TEXT;
    sender_name TEXT;
    acceptance_check TEXT;
    has_pending_request BOOLEAN;
BEGIN
    acceptance_check := LOWER(TRIM(NEW.content));
    
    IF acceptance_check = 'yes' THEN
        -- Verify there's an actual pending friend request from the recipient to the sender
        -- (i.e., the recipient previously added the sender as a friend, triggering a notification)
        SELECT EXISTS(
            SELECT 1 FROM public.friends
            WHERE user_id = NEW.recipient_id
            AND friend_personal_code = (
                SELECT personal_code FROM public.profiles WHERE user_id = NEW.sender_id
            )
        ) INTO has_pending_request;
        
        -- Only proceed if there's actually a friend relationship from recipient to sender
        IF NOT has_pending_request THEN
            RETURN NEW;
        END IF;
        
        -- Check if sender already has recipient as friend (avoid duplicate)
        IF EXISTS(
            SELECT 1 FROM public.friends f
            JOIN public.profiles p ON p.personal_code = f.friend_personal_code
            WHERE f.user_id = NEW.sender_id
            AND p.user_id = NEW.recipient_id
        ) THEN
            RETURN NEW;
        END IF;
        
        -- Get sender's personal code
        SELECT personal_code INTO sender_personal_code
        FROM public.profiles WHERE user_id = NEW.recipient_id;
        
        IF sender_personal_code IS NULL THEN
            RETURN NEW;
        END IF;
        
        -- Add recipient to sender's friends
        INSERT INTO public.friends (user_id, friend_personal_code, friend_display_name, friend_first_name, friend_last_name)
        SELECT 
            NEW.sender_id,
            sender_personal_code,
            p.display_name,
            p.first_name,
            p.last_name
        FROM public.profiles p
        WHERE p.user_id = NEW.recipient_id;
        
        -- Send confirmation
        INSERT INTO public.direct_messages (sender_id, recipient_id, content)
        VALUES (
            NEW.sender_id, 
            NEW.recipient_id, 
            'Great! You have been added to my friends codes. We are now connected!'
        );
    END IF;
    
    RETURN NEW;
END;
$function$;

-- 3. IMPROVE handle_friend_addition: Add null safety
CREATE OR REPLACE FUNCTION public.handle_friend_addition()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    friend_user_id UUID;
    friend_name TEXT;
    adder_name TEXT;
    adder_personal_code TEXT;
    message_content TEXT;
BEGIN
    -- Get the user_id of the person whose personal code was added
    SELECT user_id, COALESCE(display_name, NULLIF(TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')), ''), email, 'Someone')
    INTO friend_user_id, friend_name
    FROM public.profiles 
    WHERE personal_code = NEW.friend_personal_code;
    
    -- Get the adder's name and personal code
    SELECT 
        COALESCE(display_name, NULLIF(TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')), ''), email, 'Someone'),
        personal_code
    INTO adder_name, adder_personal_code
    FROM public.profiles 
    WHERE user_id = NEW.user_id;
    
    -- Only proceed if we found the friend user, they're not the same person, and we have a personal code
    IF friend_user_id IS NOT NULL AND friend_user_id != NEW.user_id AND adder_personal_code IS NOT NULL THEN
        message_content := adder_name || ' added you to their friends codes! Their personal code is: ' || 
                          adder_personal_code || 
                          '. Would you like to add them to your friends codes? Reply "yes" to accept.';
        
        INSERT INTO public.direct_messages (sender_id, recipient_id, content)
        VALUES (NEW.user_id, friend_user_id, message_content);
    END IF;
    
    RETURN NEW;
END;
$function$;

-- 4. IMPROVE handle_new_user: Fix null name concatenation
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  trance_tribe_id UUID;
  v_first_name TEXT;
  v_last_name TEXT;
  v_display_name TEXT;
BEGIN
  v_first_name := NEW.raw_user_meta_data ->> 'first_name';
  v_last_name := NEW.raw_user_meta_data ->> 'last_name';
  
  -- Build display_name with proper null handling
  v_display_name := COALESCE(
    NEW.raw_user_meta_data ->> 'display_name',
    NULLIF(TRIM(COALESCE(v_first_name, '') || ' ' || COALESCE(v_last_name, '')), ''),
    SPLIT_PART(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (user_id, display_name, first_name, last_name, email, personal_code, phone_number)
  VALUES (
    NEW.id, 
    v_display_name,
    v_first_name,
    v_last_name,
    NEW.email,
    generate_personal_code(),
    NEW.raw_user_meta_data ->> 'phone_number'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role);
  
  SELECT p.id INTO trance_tribe_id
  FROM public.productions p
  JOIN public.profiles prof ON p.created_by = prof.user_id
  WHERE prof.email = 'eyalsteinman@gmail.com'
  AND LOWER(p.name) LIKE '%trance%tribe%'
  LIMIT 1;
  
  IF trance_tribe_id IS NOT NULL THEN
    INSERT INTO public.production_followers (user_id, production_id)
    VALUES (NEW.id, trance_tribe_id)
    ON CONFLICT (user_id, production_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 5. IMPROVE expire_old_offers: Add index hint and batch size safety
CREATE OR REPLACE FUNCTION public.expire_old_offers()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.admin_offers 
  SET status = 'expired', updated_at = now()
  WHERE status = 'pending' 
    AND expires_at IS NOT NULL 
    AND expires_at < now()
    AND id IN (
      SELECT id FROM public.admin_offers
      WHERE status = 'pending' AND expires_at IS NOT NULL AND expires_at < now()
      LIMIT 1000
    );
END;
$function$;
