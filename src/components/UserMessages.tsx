import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import Footer from '@/components/ui/footer';
import PageHeader from '@/components/ui/page-header';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserMessagesProps {
  onBack: () => void;
  userId: string;
  onOpenTribes?: () => void;
}

interface Message {
  id: string;
  subject: string;
  content: string;
  created_at: string;
  created_by: string;
  is_read: boolean;
  production_id: string;
  recipient_id: string;
}

const UserMessages = ({ onBack, userId }: UserMessagesProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Fetching messages for user:', user.id);

      // Get messages directly using user ID
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      console.log('Fetched messages:', data);
      
      // Get sender names for each message
      const messagesWithSender = await Promise.all(
        (data || []).map(async (msg) => {
          try {
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('display_name, first_name, last_name')
              .eq('user_id', msg.created_by)
              .single();
            
            return {
              ...msg,
              sender_name: senderProfile?.display_name || 
                          `${senderProfile?.first_name || ''} ${senderProfile?.last_name || ''}`.trim() || 
                          'System'
            };
          } catch {
            return {
              ...msg,
              sender_name: 'System'
            };
          }
        })
      );
      
      setMessages(messagesWithSender);
    } catch (error) {
      console.error('Error in fetchMessages:', error);
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

      if (error) {
        console.error('Error marking message as read:', error);
        return;
      }

      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ));
    } catch (error) {
      console.error('Error in markAsRead:', error);
    }
  };

  const getPreview = (content: string) => {
    const lines = content.split('\n').slice(0, 3);
    return lines.join('\n');
  };

  if (selectedMessage) {
    return (
      <div className="app-background min-h-screen">
        {/* Floating particles */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-ping opacity-40"></div>
          <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-accent rounded-full animate-ping opacity-60 delay-1000"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-radial from-accent/30 to-transparent rounded-full blur-3xl animate-float"></div>
        </div>
        
        <div className="relative z-10 p-4 w-full">
          <div className="floating-section">
            <Button
              variant="ghost"
              onClick={() => setSelectedMessage(null)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Messages
            </Button>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  {selectedMessage.subject}
                </CardTitle>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>From: {(selectedMessage as any).sender_name || 'System'}</p>
                  <p>
                    <Calendar className="h-4 w-4 inline mr-1" />
                    {format(new Date(selectedMessage.created_at), 'PPp')}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap">{selectedMessage.content}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-background min-h-screen">
      {/* Floating particles */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-ping opacity-40"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-accent rounded-full animate-ping opacity-60 delay-1000"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-radial from-accent/30 to-transparent rounded-full blur-3xl animate-float"></div>
      </div>
      
      <div className="relative z-10 p-4 w-full">
        <div className="floating-section">
          <PageHeader
            title="Tribe Messages"
            onBack={onBack}
            showBackButton={true}
          />
        </div>

        <div className="floating-section">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <div className="text-6xl">📭</div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">No messages yet</h3>
                <p className="text-muted-foreground">
                  You'll receive tribe updates and announcements here
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <Card 
                  key={message.id} 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    !message.is_read ? 'border-primary/50 bg-primary/5' : ''
                  }`}
                  onClick={() => {
                    setSelectedMessage(message);
                    if (!message.is_read) {
                      markAsRead(message.id);
                    }
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base font-medium line-clamp-2">
                        {message.subject}
                        {!message.is_read && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            New
                          </Badge>
                        )}
                      </CardTitle>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      From: {(message as any).sender_name || 'System'} • {format(new Date(message.created_at), 'MMM d, yyyy')}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {getPreview(message.content)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="floating-section">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default UserMessages;