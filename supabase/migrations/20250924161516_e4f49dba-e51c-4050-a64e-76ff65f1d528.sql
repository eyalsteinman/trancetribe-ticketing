-- Create enum for offer types
CREATE TYPE public.offer_type AS ENUM ('free_ticket', 'discount_ticket', 'vip_offer', 'bartab_offer', 'insurance_offer');

-- Create enum for offer status
CREATE TYPE public.offer_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');

-- Create table for admin offers to users
CREATE TABLE public.admin_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE,
  production_id UUID REFERENCES public.productions(id) ON DELETE CASCADE,
  offer_type public.offer_type NOT NULL,
  status public.offer_status NOT NULL DEFAULT 'pending',
  original_price NUMERIC,
  discount_amount NUMERIC,
  discounted_price NUMERIC,
  expires_at TIMESTAMP WITH TIME ZONE,
  message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin_offers
ALTER TABLE public.admin_offers ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_offers
CREATE POLICY "Admins can manage their own offers" 
ON public.admin_offers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) AND admin_id = auth.uid())
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND admin_id = auth.uid());

CREATE POLICY "Users can view offers sent to them" 
ON public.admin_offers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update status of offers sent to them" 
ON public.admin_offers 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create table for offer acceptances (for tracking and creating QR codes/payments)
CREATE TABLE public.offer_acceptances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID NOT NULL REFERENCES public.admin_offers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  qr_code_id UUID REFERENCES public.qr_codes(id),
  payment_id UUID REFERENCES public.payments(id),
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS on offer_acceptances
ALTER TABLE public.offer_acceptances ENABLE ROW LEVEL SECURITY;

-- RLS policies for offer_acceptances
CREATE POLICY "Users can view their own acceptances" 
ON public.offer_acceptances 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own acceptances" 
ON public.offer_acceptances 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view acceptances for their offers" 
ON public.offer_acceptances 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_offers ao 
    WHERE ao.id = offer_id AND ao.admin_id = auth.uid()
  )
);

-- Create function to handle offer acceptance for free tickets
CREATE OR REPLACE FUNCTION public.handle_free_ticket_acceptance()
RETURNS TRIGGER AS $$
DECLARE
  offer_record public.admin_offers%ROWTYPE;
  qr_code_text TEXT;
  new_qr_id UUID;
BEGIN
  -- Get the offer details
  SELECT * INTO offer_record FROM public.admin_offers WHERE id = NEW.offer_id;
  
  -- Only proceed for free ticket offers
  IF offer_record.offer_type = 'free_ticket' THEN
    -- Generate QR code
    SELECT personal_code INTO qr_code_text FROM public.profiles WHERE user_id = NEW.user_id;
    qr_code_text := qr_code_text || '-' || offer_record.party_id || '-' || 
                   extract(epoch from now())::text || '-' || 
                   substr(md5(random()::text), 1, 5);
    
    -- Create QR code entry
    INSERT INTO public.qr_codes (
      user_id, 
      party_id, 
      code, 
      is_approved, 
      auto_approved,
      is_scanned
    ) VALUES (
      NEW.user_id,
      offer_record.party_id,
      qr_code_text,
      true, -- Auto-approve free tickets from admin offers
      true,
      false
    ) RETURNING id INTO new_qr_id;
    
    -- Update the acceptance record with the QR code ID
    NEW.qr_code_id := new_qr_id;
    
    -- Update offer status to accepted
    UPDATE public.admin_offers 
    SET status = 'accepted', updated_at = now() 
    WHERE id = NEW.offer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for free ticket acceptance
CREATE TRIGGER on_offer_acceptance_free_ticket
  BEFORE INSERT ON public.offer_acceptances
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_free_ticket_acceptance();

-- Create function to send tribe message when offer is created
CREATE OR REPLACE FUNCTION public.notify_offer_in_tribes()
RETURNS TRIGGER AS $$
DECLARE
  user_profile public.profiles%ROWTYPE;
  admin_profile public.profiles%ROWTYPE;
  party_record public.parties%ROWTYPE;
  production_record public.productions%ROWTYPE;
  message_content TEXT;
  offer_message TEXT;
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
  
  -- Send message to user
  INSERT INTO public.messages (
    created_by,
    recipient_id,
    production_id,
    subject,
    content
  ) VALUES (
    NEW.admin_id,
    NEW.user_id,
    NEW.production_id,
    'Special Offer from ' || admin_profile.display_name,
    offer_message
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to send tribe message when offer is created
CREATE TRIGGER on_admin_offer_created
  AFTER INSERT ON public.admin_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_offer_in_tribes();

-- Create function to handle offer expiration
CREATE OR REPLACE FUNCTION public.expire_old_offers()
RETURNS void AS $$
BEGIN
  UPDATE public.admin_offers 
  SET status = 'expired', updated_at = now()
  WHERE status = 'pending' 
    AND expires_at IS NOT NULL 
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add updated_at trigger to admin_offers
CREATE TRIGGER update_admin_offers_updated_at
  BEFORE UPDATE ON public.admin_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_admin_offers_user_id ON public.admin_offers(user_id);
CREATE INDEX idx_admin_offers_admin_id ON public.admin_offers(admin_id);
CREATE INDEX idx_admin_offers_party_id ON public.admin_offers(party_id);
CREATE INDEX idx_admin_offers_status ON public.admin_offers(status);
CREATE INDEX idx_admin_offers_expires_at ON public.admin_offers(expires_at);
CREATE INDEX idx_offer_acceptances_offer_id ON public.offer_acceptances(offer_id);
CREATE INDEX idx_offer_acceptances_user_id ON public.offer_acceptances(user_id);