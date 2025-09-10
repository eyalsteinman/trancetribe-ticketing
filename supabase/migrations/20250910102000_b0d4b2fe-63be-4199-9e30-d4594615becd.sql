-- Create messages table for admin-user communication
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL,
  production_id UUID REFERENCES public.productions(id),
  recipient_id UUID,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for messages
CREATE POLICY "Users can view their own messages" 
ON public.messages 
FOR SELECT 
USING (auth.uid() = recipient_id);

CREATE POLICY "Admins can view all messages" 
ON public.messages 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND created_by = auth.uid());

CREATE POLICY "Users can update their message read status" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

CREATE POLICY "Admins can update their messages" 
ON public.messages 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) AND created_by = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();