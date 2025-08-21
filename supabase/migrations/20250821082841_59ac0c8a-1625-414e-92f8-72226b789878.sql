-- Create ticket_types table for multiple ticket types per party
CREATE TABLE public.ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL,
  label TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 0,
  sold INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_ticket_types_party FOREIGN KEY (party_id) REFERENCES public.parties(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view ticket types" ON public.ticket_types
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage ticket types" ON public.ticket_types
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Add max_tickets_per_user to parties table
ALTER TABLE public.parties ADD COLUMN max_tickets_per_user INTEGER DEFAULT 1;

-- Add ticket_type_id to qr_codes for tracking which ticket type was purchased
ALTER TABLE public.qr_codes ADD COLUMN ticket_type_id UUID REFERENCES public.ticket_types(id) ON DELETE SET NULL;

-- Add start_time and end_time to parties if not exists (checking first)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parties' AND column_name = 'start_time') THEN
    ALTER TABLE public.parties ADD COLUMN start_time TIME;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parties' AND column_name = 'end_time') THEN
    ALTER TABLE public.parties ADD COLUMN end_time TIME;
  END IF;
END
$$;

-- Create trigger for updating ticket sold count
CREATE OR REPLACE FUNCTION update_ticket_sold_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.ticket_type_id IS NOT NULL THEN
    UPDATE public.ticket_types 
    SET sold = sold + 1 
    WHERE id = NEW.ticket_type_id;
  END IF;
  
  IF TG_OP = 'DELETE' AND OLD.ticket_type_id IS NOT NULL THEN
    UPDATE public.ticket_types 
    SET sold = GREATEST(0, sold - 1) 
    WHERE id = OLD.ticket_type_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ticket_sold_count
  AFTER INSERT OR DELETE ON public.qr_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_sold_count();

-- Remove old duplicate QR codes (keep only the latest one per user per party)
DELETE FROM public.qr_codes 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, party_id) id
  FROM public.qr_codes
  ORDER BY user_id, party_id, created_at DESC
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE public.qr_codes ADD CONSTRAINT unique_user_party_qr UNIQUE (user_id, party_id);