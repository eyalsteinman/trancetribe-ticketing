-- Create game_scores table for storing admin game scores
CREATE TABLE public.game_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  game_type TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for game scores
CREATE POLICY "Admins can view all game scores" 
ON public.game_scores 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert their own scores" 
ON public.game_scores 
FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()) AND auth.uid() = admin_id);

CREATE POLICY "Admins can update their own scores" 
ON public.game_scores 
FOR UPDATE 
USING (public.is_admin(auth.uid()) AND auth.uid() = admin_id);

CREATE POLICY "Admins can delete their own scores" 
ON public.game_scores 
FOR DELETE 
USING (public.is_admin(auth.uid()) AND auth.uid() = admin_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_game_scores_updated_at
BEFORE UPDATE ON public.game_scores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_game_scores_admin_game ON public.game_scores(admin_id, game_type);
CREATE INDEX idx_game_scores_game_score ON public.game_scores(game_type, score DESC);