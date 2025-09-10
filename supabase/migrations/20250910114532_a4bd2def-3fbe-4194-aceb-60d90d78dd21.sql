-- Create direct messages table for user-to-user messaging
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for direct messages
CREATE POLICY "Users can send direct messages" ON public.direct_messages
FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view their direct messages" ON public.direct_messages
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can update read status of received messages" ON public.direct_messages
FOR UPDATE USING (auth.uid() = recipient_id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_recipient 
ON public.direct_messages (sender_id, recipient_id);

CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at 
ON public.direct_messages (created_at);