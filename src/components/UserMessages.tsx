import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  production_name?: string;
}

interface UserMessagesProps {
  onBack: () => void;
  userId: string;
  onOpenTribes?: () => void;
}

const UserMessages: React.FC<UserMessagesProps> = ({ onBack, userId, onOpenTribes }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'production'>('date');
  const { toast } = useToast();

  useEffect(() => {
    loadMessages();
  }, [userId]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          subject,
          content,
          is_read,
          created_at,
          productions:production_id (name)
        `)
        .eq('recipient_id', userId)
        .eq('deleted_by_recipient', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedMessages = data.map(msg => ({
        ...msg,
        production_name: msg.productions?.name || 'General'
      }));

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
        .from('messages')
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
        .from('messages')
        .update({ deleted_by_recipient: true })
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

  const sortedMessages = [...messages].sort((a, b) => {
    if (sortBy === 'production') {
      const prodA = a.production_name || 'General';
      const prodB = b.production_name || 'General';
      return prodA.localeCompare(prodB);
    }
    // Default to date sorting (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      markAsRead(message.id);
    }
  };

  const getMessagePreview = (content: string) => {
    const lines = content.split('\n').slice(0, 3);
    return lines.join('\n');
  };

  if (selectedMessage) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setSelectedMessage(null)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Messages
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selectedMessage.subject}</span>
                <Badge variant="secondary">
                  {selectedMessage.production_name}
                </Badge>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="mr-2 h-5 w-5" />
              Tribe Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!loading && messages.length > 0 && (
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-medium">Sort by:</label>
                <Select value={sortBy} onValueChange={(value: 'date' | 'production') => setSortBy(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No messages yet
              </div>
            ) : (
              <div className="space-y-4">
                {sortedMessages.map((message) => (
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
                          {message.subject}
                          {!message.is_read && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              New
                            </Badge>
                          )}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {message.production_name}
                          </Badge>
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
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {new Date(message.created_at).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {getMessagePreview(message.content)}
                        {message.content.split('\n').length > 3 && '...'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!loading && (
              <div className="mt-6 pt-6 border-t border-border">
                <Button 
                  onClick={onOpenTribes}
                  className="w-full bg-primary text-white hover:bg-primary/90"
                >
                  Create Your Own Tribe
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserMessages;