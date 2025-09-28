-- Create function to send tribe messages when admin offers are created
CREATE OR REPLACE FUNCTION notify_tribe_with_offer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_profile public.profiles%ROWTYPE;
  admin_profile public.profiles%ROWTYPE;
  party_record public.parties%ROWTYPE;
  production_record public.productions%ROWTYPE;
  offer_message TEXT;
  user_tribes UUID[];
BEGIN
  -- Get user and admin profiles
  SELECT * INTO user_profile FROM public.profiles WHERE user_id = NEW.user_id;
  SELECT * INTO admin_profile FROM public.profiles WHERE user_id = NEW.admin_id;
  
  -- Get party details if applicable
  IF NEW.party_id IS NOT NULL THEN
    SELECT * INTO party_record FROM public.parties WHERE id = NEW.party_id;
  END IF;
  
  -- Get production details if applicable
  IF NEW.production_id IS NOT NULL THEN
    SELECT * INTO production_record FROM public.productions WHERE id = NEW.production_id;
  END IF;
  
  -- Create message based on offer type
  CASE NEW.offer_type
    WHEN 'free_ticket' THEN
      offer_message := admin_profile.display_name || ' has sent you a FREE TICKET for ' || 
                      COALESCE(party_record.name, 'an event') || '! ' ||
                      COALESCE(NEW.message, '') || ' Click here to accept and get your QR code instantly!';
    WHEN 'discount_ticket' THEN
      offer_message := admin_profile.display_name || ' has sent you a DISCOUNT OFFER for ' || 
                      COALESCE(party_record.name, 'an event') || '! ' ||
                      'Original price: ₪' || COALESCE(NEW.original_price::text, '0') || 
                      ', Your discounted price: ₪' || COALESCE(NEW.discounted_price::text, '0') || '. ' ||
                      COALESCE(NEW.message, '') || ' Click here to purchase at the discounted price!';
    WHEN 'vip_offer' THEN
      offer_message := admin_profile.display_name || ' has sent you a VIP OFFER for ' || 
                      COALESCE(production_record.name, 'a production') || '! ' ||
                      COALESCE(NEW.message, '') || ' Click here to purchase VIP access!';
    WHEN 'bartab_offer' THEN
      offer_message := admin_profile.display_name || ' has sent you a BAR TAB OFFER for ' || 
                      COALESCE(production_record.name, 'a production') || '! ' ||
                      COALESCE(NEW.message, '') || ' Click here to purchase your bar tab!';
    WHEN 'insurance_offer' THEN
      offer_message := admin_profile.display_name || ' has sent you an INSURANCE OFFER! ' ||
                      COALESCE(NEW.message, '') || ' Click here to purchase insurance coverage!';
  END CASE;
  
  -- Get all tribes the user belongs to
  SELECT ARRAY_AGG(tribe_id) INTO user_tribes
  FROM public.tribe_members
  WHERE user_id = NEW.user_id;
  
  -- Send message to all tribes the user belongs to
  IF user_tribes IS NOT NULL AND array_length(user_tribes, 1) > 0 THEN
    INSERT INTO public.tribe_messages (tribe_id, sender_id, content)
    SELECT 
      unnest(user_tribes) as tribe_id,
      NEW.admin_id as sender_id,
      offer_message as content;
  END IF;
  
  RETURN NEW;
END;
$$;