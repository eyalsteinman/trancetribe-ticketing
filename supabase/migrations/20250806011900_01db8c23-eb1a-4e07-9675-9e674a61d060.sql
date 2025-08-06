-- Add is_active column to parties table
ALTER TABLE public.parties 
ADD COLUMN is_active boolean NOT NULL DEFAULT false;