
-- Add missing updated_at triggers only for tables that don't have them yet

-- ticket_types needs an updated_at trigger
CREATE TRIGGER update_ticket_types_updated_at
  BEFORE UPDATE ON public.ticket_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
