-- WAITING LIST
CREATE TABLE public.party_waitlist (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  party_id uuid NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  notified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (party_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.party_waitlist TO authenticated;
GRANT ALL ON public.party_waitlist TO service_role;

ALTER TABLE public.party_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own waitlist entries"
ON public.party_waitlist FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Party owners can view their waitlist"
ON public.party_waitlist FOR SELECT TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.parties p WHERE p.id = party_id AND p.created_by = auth.uid())
);

CREATE POLICY "Party owners can update their waitlist"
ON public.party_waitlist FOR UPDATE TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.parties p WHERE p.id = party_id AND p.created_by = auth.uid())
);

CREATE INDEX idx_party_waitlist_party ON public.party_waitlist(party_id);
CREATE INDEX idx_party_waitlist_user ON public.party_waitlist(user_id);

CREATE TRIGGER update_party_waitlist_updated_at
BEFORE UPDATE ON public.party_waitlist
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PROMO CODES
CREATE TABLE public.promo_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL,
  party_id uuid REFERENCES public.parties(id) ON DELETE CASCADE,
  production_id uuid REFERENCES public.productions(id) ON DELETE CASCADE,
  discount_percent numeric,
  discount_amount numeric,
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_promo_codes_code_unique ON public.promo_codes (upper(code));
CREATE INDEX idx_promo_codes_party ON public.promo_codes(party_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_codes TO authenticated;
GRANT ALL ON public.promo_codes TO service_role;

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed in users can read active promo codes"
ON public.promo_codes FOR SELECT TO authenticated
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Creators and super admins can read their promo codes"
ON public.promo_codes FOR SELECT TO authenticated
USING (created_by = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can create promo codes for their parties"
ON public.promo_codes FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND public.is_admin(auth.uid())
  AND (
    party_id IS NULL
    OR public.is_super_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.parties p WHERE p.id = party_id AND p.created_by = auth.uid())
  )
);

CREATE POLICY "Creators and super admins can update promo codes"
ON public.promo_codes FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "Creators and super admins can delete promo codes"
ON public.promo_codes FOR DELETE TO authenticated
USING (created_by = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE TRIGGER update_promo_codes_updated_at
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- EVENT REVIEWS
CREATE TABLE public.party_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  party_id uuid NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (party_id, user_id)
);

CREATE OR REPLACE FUNCTION public.validate_party_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_party_review_trigger
BEFORE INSERT OR UPDATE ON public.party_reviews
FOR EACH ROW EXECUTE FUNCTION public.validate_party_review();

GRANT SELECT ON public.party_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.party_reviews TO authenticated;
GRANT ALL ON public.party_reviews TO service_role;

ALTER TABLE public.party_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews"
ON public.party_reviews FOR SELECT
USING (true);

CREATE POLICY "Users manage their own reviews"
ON public.party_reviews FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_party_reviews_party ON public.party_reviews(party_id);

CREATE TRIGGER update_party_reviews_updated_at
BEFORE UPDATE ON public.party_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();