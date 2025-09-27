-- Add insurance fields to productions table
ALTER TABLE public.productions 
ADD COLUMN insurance_description text,
ADD COLUMN insurance_price numeric,
ADD COLUMN insurance_enabled boolean NOT NULL DEFAULT true;