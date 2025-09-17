-- Create function to handle friend addition notifications
CREATE OR REPLACE FUNCTION public.handle_friend_addition()
RETURNS TRIGGER AS $$
DECLARE
    friend_user_id UUID;
    friend_name TEXT;
    adder_name TEXT;
    message_content TEXT;
BEGIN
    -- Get the user_id of the person whose personal code was added
    SELECT user_id, COALESCE(display_name, first_name || ' ' || last_name, email) 
    INTO friend_user_id, friend_name
    FROM public.profiles 
    WHERE personal_code = NEW.friend_personal_code;
    
    -- Get the name of the person who added the friend
    SELECT COALESCE(display_name, first_name || ' ' || last_name, email)
    INTO adder_name
    FROM public.profiles 
    WHERE user_id = NEW.user_id;
    
    -- Only proceed if we found the friend user
    IF friend_user_id IS NOT NULL AND friend_user_id != NEW.user_id THEN
        -- Create the message content
        message_content := adder_name || ' added you to their friends codes! Their personal code is: ' || 
                          (SELECT personal_code FROM public.profiles WHERE user_id = NEW.user_id) || 
                          '. Would you like to add them to your friends codes? Reply "yes" to accept.';
        
        -- Insert direct message to the friend
        INSERT INTO public.direct_messages (sender_id, recipient_id, content)
        VALUES (NEW.user_id, friend_user_id, message_content);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for friend addition notifications
CREATE TRIGGER trigger_friend_addition_notification
    AFTER INSERT ON public.friends
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_friend_addition();

-- Create function to handle friend acceptance replies
CREATE OR REPLACE FUNCTION public.handle_friend_acceptance()
RETURNS TRIGGER AS $$
DECLARE
    sender_personal_code TEXT;
    sender_name TEXT;
    acceptance_check TEXT;
BEGIN
    -- Check if the message content indicates acceptance
    acceptance_check := LOWER(TRIM(NEW.content));
    
    -- If the message is "yes", automatically add the sender to recipient's friends
    IF acceptance_check = 'yes' THEN
        -- Get sender's personal code and name
        SELECT personal_code, COALESCE(display_name, first_name || ' ' || last_name, email)
        INTO sender_personal_code, sender_name
        FROM public.profiles 
        WHERE user_id = NEW.sender_id;
        
        -- Add sender to recipient's friends if not already added
        INSERT INTO public.friends (user_id, friend_personal_code, friend_display_name, friend_first_name, friend_last_name)
        SELECT 
            NEW.recipient_id,
            sender_personal_code,
            p.display_name,
            p.first_name,
            p.last_name
        FROM public.profiles p
        WHERE p.user_id = NEW.sender_id
        AND NOT EXISTS (
            SELECT 1 FROM public.friends f 
            WHERE f.user_id = NEW.recipient_id 
            AND f.friend_personal_code = sender_personal_code
        );
        
        -- Send confirmation message back
        INSERT INTO public.direct_messages (sender_id, recipient_id, content)
        VALUES (
            NEW.recipient_id, 
            NEW.sender_id, 
            'Great! You have been added to my friends codes. We are now connected!'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for friend acceptance handling
CREATE TRIGGER trigger_friend_acceptance
    AFTER INSERT ON public.direct_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_friend_acceptance();