-- Create production_followers table for users to join/follow productions
CREATE TABLE public.production_followers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  production_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, production_id)
);

-- Enable RLS
ALTER TABLE public.production_followers ENABLE ROW LEVEL SECURITY;

-- Users can view their own followings
CREATE POLICY "Users can view own followings"
ON public.production_followers
FOR SELECT
USING (auth.uid() = user_id);

-- Users can follow productions
CREATE POLICY "Users can follow productions"
ON public.production_followers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can unfollow productions
CREATE POLICY "Users can unfollow productions"
ON public.production_followers
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view followers of their productions
CREATE POLICY "Admins can view their production followers"
ON public.production_followers
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) AND 
  EXISTS (
    SELECT 1 FROM public.productions p 
    WHERE p.id = production_followers.production_id 
    AND p.created_by = auth.uid()
  )
);

-- Create index for performance
CREATE INDEX idx_production_followers_user_id ON public.production_followers(user_id);
CREATE INDEX idx_production_followers_production_id ON public.production_followers(production_id);