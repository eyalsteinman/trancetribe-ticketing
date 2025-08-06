-- Add photo_url column to parties table
ALTER TABLE public.parties ADD COLUMN photo_url TEXT;

-- Create storage bucket for party photos
INSERT INTO storage.buckets (id, name, public) VALUES ('party-photos', 'party-photos', true);

-- Create storage policies for party photos
CREATE POLICY "Anyone can view party photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'party-photos');

CREATE POLICY "Admins can upload party photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'party-photos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update party photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'party-photos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete party photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'party-photos' AND has_role(auth.uid(), 'admin'::app_role));