import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/ui/page-header';
import Footer from '@/components/ui/footer';
import { usePhoneBackNavigation } from '@/hooks/usePhoneBackNavigation';

interface DirectMessage {
  id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_id: string;
  sender_name?: string;
}

interface UserDirectMessagesProps {
  onBack: () => void;
  userId: string;
}

const UserDirectMessages: React.FC<UserDirectMessagesProps> = ({ onBack, userId }) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<DirectMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  usePhoneBackNavigation({
    onBackNavigation: () => {
      if (selectedMessage) {
        setSelectedMessage(null);
      } else {
        onBack();
      }
    },
    isActive: true
  });

  useEffect(() => {
    loadMessages();
  }, [userId]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          id,
          content,
          is_read,
          created_at,
          sender_id
        `)
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get sender profiles separately
      const senderIds = [...new Set(data?.map(msg => msg.sender_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, first_name, last_name')
        .in('user_id', senderIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const formattedMessages = (data || []).map(msg => {
        const profile = profileMap.get(msg.sender_id);
        return {
          ...msg,
          sender_name: profile?.display_name || 
                      `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 
                      'Unknown'
        };
      });

      setMessages(formattedMessages);
    } catch (error: any) {
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ));
    } catch (error: any) {
      console.error('Error marking message as read:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('direct_messages')
        .delete()
        .eq('id', messageId)
        .eq('recipient_id', userId);

      if (error) throw error;

      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
      
      toast({
        title: "Message deleted",
        description: "The message has been deleted successfully."
      });
    } catch (error: any) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleMessageClick = (message: DirectMessage) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      markAsRead(message.id);
    }
  };

  if (selectedMessage) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => setSelectedMessage(null)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Messages
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedMessage(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>From: {selectedMessage.sender_name}</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteMessage(selectedMessage.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {new Date(selectedMessage.created_at).toLocaleString()}
              </p>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap">{selectedMessage.content}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto space-y-6">
        <PageHeader
          title="Direct Messages"
          onBack={onBack}
          showBackButton={true}
        />

        <div className="space-y-6 pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Direct Messages</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No direct messages yet
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <Card
                      key={message.id}
                      className={`cursor-pointer transition-colors hover:bg-accent ${
                        !message.is_read ? 'border-primary' : ''
                      }`}
                      onClick={() => handleMessageClick(message)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-sm flex-1">
                            From: {message.sender_name}
                            {!message.is_read && (
                              <Badge variant="destructive" className="ml-2 text-xs">
                                New
                              </Badge>
                            )}
                          </h3>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMessage(message.id);
                            }}
                            className="h-6 w-6 p-0 relative"
                          >
                            <div className="absolute inset-0 bg-red-500 rounded-sm opacity-80"></div>
                            <Trash2 className="h-3 w-3 text-white relative z-10" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {new Date(message.created_at).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {message.content.length > 100 ? 
                            `${message.content.substring(0, 100)}...` : 
                            message.content
                          }
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default UserDirectMessages;