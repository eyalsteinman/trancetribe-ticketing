import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Users, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

import Footer from '@/components/ui/footer';

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
  is_read: boolean;
}

interface Friend {
  id: string;
  friend_personal_code: string;
  friend_display_name: string;
  friend_first_name?: string;
  friend_last_name?: string;
}

interface Conversation {
  friend_id: string;
  friend_name: string;
  friend_code: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

const UserMessaging: React.FC<UserMessagingProps> = ({ onBack, userId }) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newFriendCode, setNewFriendCode] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [currentView, setCurrentView] = useState<'conversations' | 'new-message' | 'chat'>('conversations');
  const { toast } = useToast();

  useEffect(() => {
    loadFriends();
    loadConversations();
  }, [userId]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
    }
  }, [selectedConversation]);

  const loadFriends = async () => {
    try {
      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      setFriends(data || []);
    } catch (error: any) {
      console.error('Error loading friends:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const { data: messages, error } = await supabase
        .from('direct_messages')
        .select('sender_id, recipient_id, content, created_at, is_read')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by conversation partner
      const conversationMap = new Map<string, Conversation>();
      
      messages?.forEach(msg => {
        const partnerId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
        const isIncoming = msg.recipient_id === userId;
        
        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            friend_id: partnerId,
            friend_name: `User ${partnerId.slice(0, 8)}`,
            friend_code: '',
            last_message: msg.content,
            last_message_time: msg.created_at,
            unread_count: 0
          });
        }
        
        const conversation = conversationMap.get(partnerId)!;
        if (!conversation.last_message_time || msg.created_at > conversation.last_message_time) {
          conversation.last_message = msg.content;
          conversation.last_message_time = msg.created_at;
        }
        
        if (isIncoming && !msg.is_read) {
          conversation.unread_count++;
        }
      });

      // Get friend names for known friends
      const friendIds = Array.from(conversationMap.keys());
      const { data: profiles } = await supabase
        .from('friends')
        .select('friend_personal_code, friend_display_name, friend_first_name')
        .eq('user_id', userId)
        .in('friend_personal_code', friendIds);

      profiles?.forEach(friend => {
        const conversation = conversationMap.get(friend.friend_personal_code);
        if (conversation) {
          conversation.friend_name = friend.friend_display_name || friend.friend_first_name || conversation.friend_name;
          conversation.friend_code = friend.friend_personal_code;
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error: any) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async () => {
    if (!selectedConversation) return;

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},recipient_id.eq.${selectedConversation}),and(sender_id.eq.${selectedConversation},recipient_id.eq.${userId})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark incoming messages as read
      const unreadMessages = data?.filter(msg => 
        msg.recipient_id === userId && !msg.is_read
      );

      if (unreadMessages && unreadMessages.length > 0) {
        await supabase
          .from('direct_messages')
          .update({ is_read: true })
          .in('id', unreadMessages.map(msg => msg.id));
        
        loadConversations(); // Refresh unread counts
      }
    } catch (error: any) {
      console.error('Error loading messages:', error);
    }
  };

  const addFriend = async () => {
    if (!newFriendCode.trim()) return;

    try {
      // Use secure lookup function
      const { data: profile, error } = await supabase
        .rpc('lookup_friend_by_personal_code', { _personal_code: newFriendCode.trim() })
        .single();

      if (error || !profile) {
        toast({
          title: "Error",
          description: "User not found with this personal code",
          variant: "destructive"
        });
        return;
      }

      // Check if already a friend
      const existingFriend = friends.find(f => f.friend_personal_code === profile.personal_code);
      if (existingFriend) {
        toast({
          title: "Already Added",
          description: "This user is already in your friends list",
          variant: "destructive"
        });
        return;
      }

      // Add to friends
      const { error: friendError } = await supabase
        .from('friends')
        .insert({
          user_id: userId,
          friend_personal_code: profile.personal_code,
          friend_display_name: profile.display_name || `${profile.first_name} ${profile.last_name}`.trim(),
          friend_first_name: profile.first_name,
          friend_last_name: profile.last_name
        });

      if (friendError) throw friendError;

      toast({
        title: "Success",
        description: "Friend added successfully!"
      });

      setNewFriendCode('');
      setShowAddFriend(false);
      loadFriends();
    } catch (error: any) {
      console.error('Error adding friend:', error);
      toast({
        title: "Error",
        description: "Failed to add friend",
        variant: "destructive"
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const recipients = selectedFriends.size > 0 
      ? Array.from(selectedFriends) 
      : selectedConversation 
      ? [selectedConversation] 
      : [];

    if (recipients.length === 0) {
      toast({
        title: "Error",
        description: "Please select recipients",
        variant: "destructive"
      });
      return;
    }

    try {
      // Use secure lookup for recipient profiles
      const profileLookups = await Promise.all(
        recipients.map(code => 
          supabase.rpc('lookup_friend_by_personal_code', { _personal_code: code })
        )
      );
      
      const profiles = profileLookups
        .filter(result => result.data && !result.error)
        .map(result => result.data) as any[];

      if (!profiles || profiles.length === 0) {
        toast({
          title: "Error",
          description: "Recipients not found",
          variant: "destructive"
        });
        return;
      }

      // Send message to each recipient
      const messagesToInsert = profiles.map(profile => ({
        sender_id: userId,
        recipient_id: profile.user_id,
        content: newMessage.trim()
      }));

      const { error } = await supabase
        .from('direct_messages')
        .insert(messagesToInsert);

      if (error) throw error;

      setNewMessage('');
      setSelectedFriends(new Set());
      
      if (selectedConversation) {
        loadMessages();
      }
      
      loadConversations();
      
      toast({
        title: "Success",
        description: `Message sent to ${recipients.length} recipient(s)!`
      });

      if (currentView === 'new-message') {
        setCurrentView('conversations');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const toggleFriendSelection = (friendCode: string) => {
    const newSelected = new Set(selectedFriends);
    if (newSelected.has(friendCode)) {
      newSelected.delete(friendCode);
    } else {
      newSelected.add(friendCode);
    }
    setSelectedFriends(newSelected);
  };

  if (currentView === 'chat' && selectedConversation) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => {
              setCurrentView('conversations');
              setSelectedConversation(null);
            }}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Conversations
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>
                {conversations.find(c => c.friend_id === selectedConversation)?.friend_name || 'Chat'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
    );
  }

  if (currentView === 'new-message') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setCurrentView('conversations')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Conversations
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>New Message</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddFriend(!showAddFriend)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Friend
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAddFriend && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newFriendCode}
                      onChange={(e) => setNewFriendCode(e.target.value)}
                      placeholder="Enter friend's personal code"
                    />
                    <Button onClick={addFriend} size="sm">
                      Add
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowAddFriend(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-medium mb-3">Select Recipients:</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {friends.map((friend) => (
                    <div key={friend.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={friend.id}
                        checked={selectedFriends.has(friend.friend_personal_code)}
                        onCheckedChange={() => toggleFriendSelection(friend.friend_personal_code)}
                      />
                      <label htmlFor={friend.id} className="text-sm font-medium">
                        {friend.friend_display_name}
                      </label>
                      <Badge variant="secondary" className="text-xs">
                        {friend.friend_personal_code}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {selectedFriends.size > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Selected: {selectedFriends.size} recipient(s)
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button 
                  onClick={sendMessage} 
                  size="sm"
                  disabled={selectedFriends.size === 0 || !newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between w-full py-4">
          <h1 className="text-2xl font-bold text-foreground">
            Direct Messages
          </h1>
          <Button 
            variant="outline" 
            onClick={onBack} 
            className="flex items-center gap-2 px-3 py-2 h-auto text-sm font-medium border-foreground/20 bg-background/50 backdrop-blur-sm text-foreground hover:bg-foreground/10 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Direct Messages</span>
              <Button
                onClick={() => setCurrentView('new-message')}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                New Message
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Friends List Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Your Friends</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddFriend(!showAddFriend)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Friend
                </Button>
              </div>

              {showAddFriend && (
                <div className="p-4 border rounded-lg bg-muted/50 mb-3">
                  <div className="flex gap-2">
                    <Input
                      value={newFriendCode}
                      onChange={(e) => setNewFriendCode(e.target.value)}
                      placeholder="Enter friend's personal code"
                      onKeyPress={(e) => e.key === 'Enter' && addFriend()}
                    />
                    <Button onClick={addFriend} size="sm">
                      Add
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowAddFriend(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {friends.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No friends added yet. Add friends to start messaging!
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {friends.map((friend) => (
                    <Card 
                      key={friend.id}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => {
                        const friendId = friend.friend_personal_code;
                        setSelectedConversation(friendId);
                        setCurrentView('chat');
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{friend.friend_display_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Code: {friend.friend_personal_code}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFriends(new Set([friend.friend_personal_code]));
                              setCurrentView('new-message');
                            }}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Conversations Section */}
            <div>
              <h3 className="font-medium mb-3">Recent Conversations</h3>
              {conversations.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No conversations yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <Card
                      key={conversation.friend_id}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => {
                        setSelectedConversation(conversation.friend_id);
                        setCurrentView('chat');
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{conversation.friend_name}</h4>
                              {conversation.unread_count > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {conversation.unread_count}
                                </Badge>
                              )}
                            </div>
                            {conversation.last_message && (
                              <p className="text-sm text-muted-foreground truncate">
                                {conversation.last_message}
                              </p>
                            )}
                            {conversation.last_message_time && (
                              <p className="text-xs text-muted-foreground">
                                {new Date(conversation.last_message_time).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default UserMessaging;