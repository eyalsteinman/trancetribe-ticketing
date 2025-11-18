-- Add indexes for improved query performance

-- Index for message recipient lookups (users checking their messages)
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);

-- Index for user payment history queries
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);

-- Index for production followers lookups (admin viewing followers of their production)
CREATE INDEX IF NOT EXISTS idx_production_followers_production_id ON public.production_followers(production_id);

-- Composite index for tribe message pagination (order by created_at within tribe)
CREATE INDEX IF NOT EXISTS idx_tribe_messages_tribe_created ON public.tribe_messages(tribe_id, created_at DESC);

-- Index for filtering parties by date
CREATE INDEX IF NOT EXISTS idx_parties_date ON public.parties(date);

-- Index for sorting admin tile state by last opened
CREATE INDEX IF NOT EXISTS idx_admin_tile_state_last_opened ON public.admin_tile_state(last_opened_at DESC);