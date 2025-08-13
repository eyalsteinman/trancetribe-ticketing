-- Add VIP description field to productions table
ALTER TABLE public.productions 
ADD COLUMN vip_description TEXT;