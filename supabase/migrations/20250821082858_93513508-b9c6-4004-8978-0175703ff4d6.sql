-- Fix function search path security issues
CREATE OR REPLACE FUNCTION update_ticket_sold_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;