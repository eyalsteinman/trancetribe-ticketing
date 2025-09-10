-- Create table to track per-admin last opened timestamps for dashboard tiles
CREATE TABLE IF NOT EXISTS public.admin_tile_state (
  admin_id UUID NOT NULL,
  tile TEXT NOT NULL,
  last_opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT admin_tile_state_pkey PRIMARY KEY (admin_id, tile)
);

-- Enable RLS
ALTER TABLE public.admin_tile_state ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage their own rows
CREATE POLICY "Admins can manage their own tile state"
ON public.admin_tile_state
FOR ALL
USING (has_role(auth.uid(), 'admin'::public.app_role) AND auth.uid() = admin_id)
WITH CHECK (has_role(auth.uid(), 'admin'::public.app_role) AND auth.uid() = admin_id);

-- Updated-at trigger
CREATE TRIGGER update_admin_tile_state_updated_at
BEFORE UPDATE ON public.admin_tile_state
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Allow admins to update any profile (fix editing bug)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::public.app_role));