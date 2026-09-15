CREATE TABLE public.loyalty_points (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  points integer NOT NULL DEFAULT 0,
  reason text NOT NULL,
  party_id uuid REFERENCES public.parties(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.loyalty_points TO authenticated;
GRANT ALL ON public.loyalty_points TO service_role;

ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own loyalty points"
ON public.loyalty_points FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all loyalty points"
ON public.loyalty_points FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE INDEX idx_loyalty_points_user ON public.loyalty_points(user_id);
CREATE INDEX idx_loyalty_points_party ON public.loyalty_points(party_id);

CREATE OR REPLACE FUNCTION public.award_attendance_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_scanned = true AND COALESCE(OLD.is_scanned, false) = false THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.loyalty_points
      WHERE user_id = NEW.user_id
        AND party_id = NEW.party_id
        AND reason = 'attendance'
    ) THEN
      INSERT INTO public.loyalty_points (user_id, points, reason, party_id)
      VALUES (NEW.user_id, 100, 'attendance', NEW.party_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.award_attendance_points() FROM anon, authenticated;

CREATE TRIGGER trg_award_attendance_points
AFTER UPDATE ON public.qr_codes
FOR EACH ROW EXECUTE FUNCTION public.award_attendance_points();