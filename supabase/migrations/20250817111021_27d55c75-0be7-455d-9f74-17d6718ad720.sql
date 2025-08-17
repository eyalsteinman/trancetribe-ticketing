-- Add ticket availability to parties table
ALTER TABLE public.parties 
ADD COLUMN ticket_count integer DEFAULT NULL;

-- Add check constraint to ensure ticket_count is positive when not null
ALTER TABLE public.parties 
ADD CONSTRAINT parties_ticket_count_positive 
CHECK (ticket_count IS NULL OR ticket_count > 0);