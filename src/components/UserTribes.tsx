import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Users, MessageCircle, Settings, Trash2, Edit2, Camera } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UserTribesProps {
  onBack: () => void;
  userId: string;
}

interface Tribe {
  id: string;
  name: string;
  description?: string;
  photo_url?: string;
  member_count: number;
  is_owner: boolean;
}

interface TribeMember {
  id: string;
  user_id: string;
  tribe_id: string;
  role: string;
  joined_at: string;
  profiles?: {
    display_name: string;
    first_name: string;
    last_name: string;
  };
}

interface TribeMessage {
  id: string;
  tribe_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles?: {
    display_name: string;
  };
}

const UserTribes: React.FC<UserTribesProps> = ({ onBack, userId }) => {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'chat' | 'members' | 'settings'>('list');
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [selectedTribe, setSelectedTribe] = useState<Tribe | null>(null);
  const [members, setMembers] = useState<TribeMember[]>([]);
  const [messages, setMessages] = useState<TribeMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTribeName, setNewTribeName] = useState('');
  const [newTribeDescription, setNewTribeDescription] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newMemberCode, setNewMemberCode] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTribes();
  }, []);

  const loadTribes = async () => {
    try {
      // First get tribes where user is creator
      const { data: createdTribes, error: createdError } = await supabase
        .from('tribes')
        .select(`
          *,
          tribe_members (
            id,
            user_id,
            role
          )
        `)
        .eq('created_by', userId);

      if (createdError) throw createdError;

      // Then get tribes where user is a member
      const { data: memberTribes, error: memberError } = await supabase
        .from('tribe_members')
        .select(`
          tribe_id,
          tribes!inner (
            *,
            tribe_members (
              id,
              user_id,
              role
            )
          )
        `)
        .eq('user_id', userId);

      if (memberError) throw memberError;

      // Combine and deduplicate tribes
      const allTribes = [...(createdTribes || [])];
      
      memberTribes?.forEach(member => {
        const tribe = member.tribes;
        if (!allTribes.find(t => t.id === tribe.id)) {
          allTribes.push(tribe);
        }
      });

      const formattedTribes = allTribes.map(tribe => ({
        ...tribe,
        member_count: tribe.tribe_members?.length || 0,
        is_owner: tribe.created_by === userId
      }));

      setTribes(formattedTribes);
    } catch (error: any) {
      console.error('Error loading tribes:', error);
      toast({
        title: "Error",
        description: "Failed to load tribes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createTribe = async () => {
    if (!newTribeName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a tribe name",
        variant: "destructive"
      });
      return;
    }

    if (tribes.filter(t => t.is_owner).length >= 5) {
      toast({
        title: "Maximum tribes reached",
        description: "You can only create up to 5 tribes",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: tribeData, error: tribeError } = await supabase
        .from('tribes')
        .insert({
          name: newTribeName.trim(),
          description: newTribeDescription.trim() || null,
          created_by: userId
        })
        .select()
        .single();

      if (tribeError) throw tribeError;

      // Add creator as owner member
      const { error: memberError } = await supabase
        .from('tribe_members')
        .insert({
          tribe_id: tribeData.id,
          user_id: userId,
          role: 'owner'
        });

      if (memberError) throw memberError;

      toast({
        title: "Success",
        description: "Tribe created successfully!"
      });

      setNewTribeName('');
      setNewTribeDescription('');
      setShowCreateDialog(false);
      loadTribes();
    } catch (error: any) {
      console.error('Error creating tribe:', error);
      toast({
        title: "Error",
        description: "Failed to create tribe",
        variant: "destructive"
      });
    }
  };

  const addMember = async () => {
    if (!newMemberCode.trim() || !selectedTribe) {
      toast({
        title: "Error",
        description: "Please enter a valid personal code",
        variant: "destructive"
      });
      return;
    }

    try {
      // Use secure lookup function
      const { data: profileData, error: profileError } = await supabase
        .rpc('lookup_friend_by_personal_code', { _personal_code: newMemberCode.trim() })
        .single();

      if (profileError || !profileData) {
        toast({
          title: "Error",
          description: "User not found with this personal code",
          variant: "destructive"
        });
        return;
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('tribe_members')
        .select('id')
        .eq('tribe_id', selectedTribe.id)
        .eq('user_id', profileData.user_id)
        .single();

      if (existingMember) {
        toast({
          title: "Error",
          description: "User is already a member of this tribe",
          variant: "destructive"
        });
        return;
      }

      // Add member
      const { error: memberError } = await supabase
        .from('tribe_members')
        .insert({
          tribe_id: selectedTribe.id,
          user_id: profileData.user_id,
          role: 'member'
        });

      if (memberError) throw memberError;

      toast({
        title: "Success",
        description: `${profileData.display_name || profileData.first_name} added to tribe!`
      });

      setNewMemberCode('');
      loadMembers();
    } catch (error: any) {
      console.error('Error adding member:', error);
      toast({
        title: "Error",
        description: "Failed to add member",
        variant: "destructive"
      });
    }
  };

  const loadMembers = async () => {
    if (!selectedTribe) return;

    try {
      const { data, error } = await supabase
        .from('tribe_members')
        .select('*')
        .eq('tribe_id', selectedTribe.id);
      
      if (error) throw error;
      
      // Fetch profiles separately
      const userIds = (data || []).map(member => member.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, first_name, last_name')
        .in('user_id', userIds);
      
      const membersWithProfiles = (data || []).map(member => ({
        ...member,
        profiles: profiles?.find(p => p.user_id === member.user_id) || null
      }));

      setMembers(membersWithProfiles);
    } catch (error: any) {
      console.error('Error loading members:', error);
    }
  };

  const loadMessages = async () => {
    if (!selectedTribe) return;

    try {
      const { data, error } = await supabase
        .from('tribe_messages')
        .select('*')
        .eq('tribe_id', selectedTribe.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Fetch profiles separately
      const senderIds = (data || []).map(msg => msg.sender_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', senderIds);
      
      const messagesWithProfiles = (data || []).map(msg => ({
        ...msg,
        profiles: profiles?.find(p => p.user_id === msg.sender_id) || null
      }));

      setMessages(messagesWithProfiles);
    } catch (error: any) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTribe) return;

    try {
      const { error } = await supabase
        .from('tribe_messages')
        .insert({
          tribe_id: selectedTribe.id,
          sender_id: userId,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
      loadMessages();
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  if (currentView === 'create') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <Button
            variant="ghost"
            onClick={() => setCurrentView('list')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tribes
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Create New Tribe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tribe Name</label>
                <Input
                  value={newTribeName}
                  onChange={(e) => setNewTribeName(e.target.value)}
                  placeholder="Enter tribe name"
                  maxLength={50}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (Optional)</label>
                <Input
                  value={newTribeDescription}
                  onChange={(e) => setNewTribeDescription(e.target.value)}
                  placeholder="Describe your tribe"
                  maxLength={200}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tribe Photo (Optional)</label>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Choose Photo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // For now, just show it's selected
                      toast({
                        title: "Photo selected",
                        description: file.name
                      });
                    }
                  }}
                />
              </div>
              <Button onClick={createTribe} className="w-full">
                Create Tribe
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentView === 'chat' && selectedTribe) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <Button
            variant="ghost"
            onClick={() => setCurrentView('list')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tribes
          </Button>

          <Card className="h-96">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{selectedTribe.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-80">
              <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                {messages.map((message) => (
                  <div key={message.id} className="p-2 bg-muted/50 rounded">
                    <div className="text-xs text-muted-foreground">
                      {message.profiles?.display_name}
                    </div>
                    <div className="text-sm">{message.content}</div>
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
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentView === 'members' && selectedTribe) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <Button
            variant="ghost"
            onClick={() => setCurrentView('list')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tribes
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>{selectedTribe.name} Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedTribe.is_owner && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Add Member by Personal Code</label>
                  <div className="flex gap-2">
                    <Input
                      value={newMemberCode}
                      onChange={(e) => setNewMemberCode(e.target.value)}
                      placeholder="Enter personal code"
                    />
                    <Button onClick={addMember} size="sm">
                      Add
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div>
                      <div className="font-medium">
                        {member.profiles?.display_name || member.profiles?.first_name}
                      </div>
                      <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
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
            <CardTitle className="flex items-center justify-between">
              <span>Your Tribes</span>
              <div className="text-foreground text-xs opacity-70">beta v1.8</div>
              <Button
                size="sm"
                onClick={() => setCurrentView('create')}
                disabled={tribes.filter(t => t.is_owner).length >= 5}
              >
                <Plus className="h-4 w-4 mr-1" />
                Create
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading tribes...</div>
            ) : tribes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tribes yet</p>
                <p className="text-sm">Create your first tribe to start messaging with friends!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tribes.map((tribe) => (
                  <Card key={tribe.id} className="cursor-pointer hover:bg-accent/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{tribe.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {tribe.member_count} members
                          </p>
                          {tribe.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {tribe.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTribe(tribe);
                              loadMessages();
                              setCurrentView('chat');
                            }}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTribe(tribe);
                              loadMembers();
                              setCurrentView('members');
                            }}
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {tribes.filter(t => t.is_owner).length >= 5 && (
              <div className="mt-4 p-3 bg-warning border border-warning rounded text-sm text-warning">
                You've reached the maximum of 5 tribes you can create.
              </div>
            )}
            
            <div className="text-center mt-4">
              <p className="text-foreground text-xs">beta v1.8</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserTribes;