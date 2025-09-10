import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserMessagingProps {
  onBack: () => void;
  userId: string;
}

interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
  recipient_name?: string;
}

const UserMessaging: React.FC<UserMessagingProps> = ({ onBack, userId }) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipientCode, setRecipientCode] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversations, setConversations] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadConversations();
  }, [userId]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      // Get all messages where user is sender or recipient
      const { data, error } = await supabase
        .from('tribe_messages')
        .select(`
          sender_id,
          tribe_id,
          profiles!tribe_messages_sender_id_fkey (display_name, first_name)
        `)
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);

      if (error) throw error;

      // Extract unique conversation partners
      const partners = new Set<string>();
      data?.forEach(msg => {
        if (msg.sender_id !== userId) partners.add(msg.sender_id);
      });

      setConversations(Array.from(partners));
    } catch (error: any) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async () => {
    if (!selectedConversation) return;

    try {
      const { data, error } = await supabase
        .from('tribe_messages')
        .select(`
          *,
          sender_profiles:profiles!tribe_messages_sender_id_fkey (display_name, first_name),
          recipient_profiles:profiles!tribe_messages_recipient_id_fkey (display_name, first_name)
        `)
        .or(`and(sender_id.eq.${userId},recipient_id.eq.${selectedConversation}),and(sender_id.eq.${selectedConversation},recipient_id.eq.${userId})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages = data?.map(msg => ({
        ...msg,
        sender_name: msg.sender_profiles?.display_name || msg.sender_profiles?.first_name,
        recipient_name: msg.recipient_profiles?.display_name || msg.recipient_profiles?.first_name
      })) || [];

      setMessages(formattedMessages);
    } catch (error: any) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    let recipientId = selectedConversation;

    // If no conversation selected, find recipient by personal code
    if (!recipientId && recipientCode.trim()) {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('personal_code', recipientCode.trim())
          .single();

        if (error || !profile) {
          toast({
            title: "Error",
            description: "User not found with this personal code",
            variant: "destructive"
          });
          return;
        }
        recipientId = profile.user_id;
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to find user",
          variant: "destructive"
        });
        return;
      }
    }

    if (!recipientId) {
      toast({
        title: "Error",
        description: "Please select a conversation or enter a personal code",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('tribe_messages')
        .insert({
          sender_id: userId,
          recipient_id: recipientId,
          content: newMessage.trim(),
          tribe_id: null // For direct messages
        });

      if (error) throw error;

      setNewMessage('');
      setRecipientCode('');
      if (!selectedConversation) {
        setSelectedConversation(recipientId);
      }
      loadMessages();
      loadConversations();
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Conversations List */}
          <Card>
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              {conversations.length === 0 ? (
                <p className="text-muted-foreground text-sm">No conversations yet</p>
              ) : (
                <div className="space-y-2">
                  {conversations.map(partnerId => (
                    <Button
                      key={partnerId}
                      variant={selectedConversation === partnerId ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setSelectedConversation(partnerId)}
                    >
                      User {partnerId.slice(0, 8)}...
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>
                {selectedConversation ? "Messages" : "Start New Conversation"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* New conversation input */}
              {!selectedConversation && (
                <div className="space-y-2">
                  <Input
                    value={recipientCode}
                    onChange={(e) => setRecipientCode(e.target.value)}
                    placeholder="Enter friend's personal code"
                  />
                </div>
              )}

              {/* Messages display */}
              {selectedConversation && (
                <div className="h-64 overflow-y-auto space-y-2 border rounded p-2">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-2 rounded max-w-xs ${
                        message.sender_id === userId
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Message input */}
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage} size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserMessaging;