-- Create tribes table
CREATE TABLE public.tribes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tribes ENABLE ROW LEVEL SECURITY;

-- Create tribe_members table
CREATE TABLE public.tribe_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tribe_id UUID NOT NULL REFERENCES public.tribes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tribe_members ENABLE ROW LEVEL SECURITY;

-- Create tribe_messages table
CREATE TABLE public.tribe_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tribe_id UUID NOT NULL REFERENCES public.tribes(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tribe_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for tribes
CREATE POLICY "Users can view tribes they are members of" 
ON public.tribes 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.tribe_members 
  WHERE tribe_id = tribes.id AND user_id = auth.uid()
));

CREATE POLICY "Users can create tribes" 
ON public.tribes 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Tribe owners can update their tribes" 
ON public.tribes 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.tribe_members 
  WHERE tribe_id = tribes.id AND user_id = auth.uid() AND role = 'owner'
));

CREATE POLICY "Tribe owners can delete their tribes" 
ON public.tribes 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.tribe_members 
  WHERE tribe_id = tribes.id AND user_id = auth.uid() AND role = 'owner'
));

-- Create policies for tribe_members
CREATE POLICY "Users can view members of tribes they belong to" 
ON public.tribe_members 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.tribe_members tm 
  WHERE tm.tribe_id = tribe_members.tribe_id AND tm.user_id = auth.uid()
));

CREATE POLICY "Tribe owners can add members" 
ON public.tribe_members 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.tribe_members 
  WHERE tribe_id = tribe_members.tribe_id AND user_id = auth.uid() AND role = 'owner'
) OR (auth.uid() = user_id AND role = 'owner'));

CREATE POLICY "Tribe owners can remove members" 
ON public.tribe_members 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.tribe_members tm 
  WHERE tm.tribe_id = tribe_members.tribe_id AND tm.user_id = auth.uid() AND tm.role = 'owner'
) OR auth.uid() = user_id);

-- Create policies for tribe_messages
CREATE POLICY "Tribe members can view messages" 
ON public.tribe_messages 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.tribe_members 
  WHERE tribe_id = tribe_messages.tribe_id AND user_id = auth.uid()
));

CREATE POLICY "Tribe members can send messages" 
ON public.tribe_messages 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.tribe_members 
  WHERE tribe_id = tribe_messages.tribe_id AND user_id = auth.uid()
) AND auth.uid() = sender_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tribes_updated_at
BEFORE UPDATE ON public.tribes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create unique constraint to prevent duplicate memberships
ALTER TABLE public.tribe_members ADD CONSTRAINT unique_tribe_user UNIQUE (tribe_id, user_id);