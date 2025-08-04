-- Drop the daily_scans table since we don't need daily reset
DROP TABLE IF EXISTS public.daily_scans;

-- Update QR codes table to track if permanently scanned
ALTER TABLE public.qr_codes 
ADD COLUMN is_scanned BOOLEAN DEFAULT FALSE,
ADD COLUMN scanned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN scanned_by UUID REFERENCES auth.users(id);

-- Create parties table for sending links
CREATE TABLE public.parties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Enable RLS on parties table
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;

-- Create party invitations table to track sent links
CREATE TABLE public.party_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(party_id, user_id)
);

-- Enable RLS on party invitations
ALTER TABLE public.party_invitations ENABLE ROW LEVEL SECURITY;

-- Update QR codes table to link to parties
ALTER TABLE public.qr_codes 
ADD COLUMN party_id UUID REFERENCES public.parties(id);

-- Policies for parties table
CREATE POLICY "Admins can manage parties" 
ON public.parties 
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view active parties" 
ON public.parties 
FOR SELECT 
USING (is_active = TRUE);

-- Policies for party invitations
CREATE POLICY "Admins can manage invitations" 
ON public.party_invitations 
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their invitations" 
ON public.party_invitations 
FOR SELECT 
USING (auth.uid() = user_id);

-- Update QR codes policies to work with new structure
DROP POLICY IF EXISTS "Users can view their own QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Users can create their own QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Admins can view all QR codes" ON public.qr_codes;

CREATE POLICY "Users can view their own QR codes" 
ON public.qr_codes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own QR codes" 
ON public.qr_codes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own QR codes" 
ON public.qr_codes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view and update all QR codes" 
ON public.qr_codes 
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));