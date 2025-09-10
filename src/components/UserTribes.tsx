import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Users, MessageCircle, Edit2, Trash2, Crown, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';

interface UserTribesProps {
  user: User;
  onBack: () => void;
}

interface Tribe {
  id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  created_by: string;
  created_at: string;
  member_count: number;
  is_owner: boolean;
}

interface TribeMember {
  id: string;
  user_id: string;
  tribe_id: string;
  role: 'owner' | 'member';
  joined_at: string;
  profiles: {
    display_name: string;
    personal_code: string;
  } | null;
}

interface TribeMessage {
  id: string;
  tribe_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles: {
    display_name: string;
  } | null;
}

const UserTribes: React.FC<UserTribesProps> = ({ user, onBack }) => {
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [selectedTribe, setSelectedTribe] = useState<Tribe | null>(null);
  const [tribeMembers, setTribeMembers] = useState<TribeMember[]>([]);
  const [tribeMessages, setTribeMessages] = useState<TribeMessage[]>([]);
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit' | 'members' | 'messages'>('list');
  const [loading, setLoading] = useState(true);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    photo_url: ''
  });
  const [addMemberCode, setAddMemberCode] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTribes();

    // Listen for tribe navigation event
    const handleTribesNavigation = () => {
      setCurrentView('list');
    };

    window.addEventListener('navigateToTribes', handleTribesNavigation);
    return () => window.removeEventListener('navigateToTribes', handleTribesNavigation);
  }, []);

  useEffect(() => {
    if (selectedTribe) {
      loadTribeMembers();
      loadTribeMessages();
    }
  }, [selectedTribe]);

  const loadTribes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tribe_members')
        .select(`
          tribes (
            id,
            name,
            description,
            photo_url,
            created_by,
            created_at
          ),
          role
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const tribesWithCounts = await Promise.all(
        (data || []).map(async (item: any) => {
          const tribe = item.tribes;
          if (!tribe) return null;

          // Get member count
          const { count, error: countError } = await supabase
            .from('tribe_members')
            .select('*', { count: 'exact', head: true })
            .eq('tribe_id', tribe.id);

          if (countError) {
            console.error('Error getting member count:', countError);
          }

          return {
            ...tribe,
            member_count: count || 0,
            is_owner: item.role === 'owner'
          };
        })
      );

      setTribes(tribesWithCounts.filter(Boolean));
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

  const loadTribeMembers = async () => {
    if (!selectedTribe) return;

    try {
      const { data, error } = await supabase
        .from('tribe_members')
        .select(`
          *,
          profiles (
            display_name,
            personal_code
          )
        `)
        .eq('tribe_id', selectedTribe.id)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      setTribeMembers(data || []);
    } catch (error: any) {
      console.error('Error loading tribe members:', error);
      toast({
        title: "Error",
        description: "Failed to load tribe members",
        variant: "destructive"
      });
    }
  };

  const loadTribeMessages = async () => {
    if (!selectedTribe) return;

    try {
      const { data, error } = await supabase
        .from('tribe_messages')
        .select(`
          *,
          profiles (
            display_name
          )
        `)
        .eq('tribe_id', selectedTribe.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTribeMessages(data || []);
    } catch (error: any) {
      console.error('Error loading tribe messages:', error);
      toast({
        title: "Error",
        description: "Failed to load tribe messages",
        variant: "destructive"
      });
    }
  };

  const createTribe = async () => {
    if (!createForm.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a tribe name",
        variant: "destructive"
      });
      return;
    }

    // Check if user already has 5 tribes
    const userTribes = tribes.filter(t => t.is_owner);
    if (userTribes.length >= 5) {
      toast({
        title: "Limit Reached",
        description: "You've reached the maximum of 5 tribes you can create",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create tribe
      const { data: tribeData, error: tribeError } = await supabase
        .from('tribes')
        .insert({
          name: createForm.name,
          description: createForm.description || null,
          photo_url: createForm.photo_url || null,
          created_by: user.id
        })
        .select()
        .single();

      if (tribeError) throw tribeError;

      // Add creator as owner
      const { error: memberError } = await supabase
        .from('tribe_members')
        .insert({
          tribe_id: tribeData.id,
          user_id: user.id,
          role: 'owner'
        });

      if (memberError) throw memberError;

      toast({
        title: "Success",
        description: "Tribe created successfully!"
      });

      setCreateForm({ name: '', description: '', photo_url: '' });
      setCurrentView('list');
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
    if (!selectedTribe || !addMemberCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid personal code",
        variant: "destructive"
      });
      return;
    }

    try {
      // Find user by personal code
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .eq('personal_code', addMemberCode.trim())
        .single();

      if (profileError || !profileData) {
        toast({
          title: "Error",
          description: "User not found with this personal code",
          variant: "destructive"
        });
        return;
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('tribe_members')
        .select('id')
        .eq('tribe_id', selectedTribe.id)
        .eq('user_id', profileData.user_id)
        .single();

      if (existingMember) {
        toast({
          title: "Error",
          description: "This user is already a member of the tribe",
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
        description: `${profileData.display_name} added to the tribe!`
      });

      setAddMemberCode('');
      loadTribeMembers();
    } catch (error: any) {
      console.error('Error adding member:', error);
      toast({
        title: "Error",
        description: "Failed to add member",
        variant: "destructive"
      });
    }
  };

  const sendMessage = async () => {
    if (!selectedTribe || !newMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('tribe_messages')
        .insert({
          tribe_id: selectedTribe.id,
          sender_id: user.id,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
      loadTribeMessages();
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const deleteTribe = async () => {
    if (!selectedTribe) return;

    try {
      const { error } = await supabase
        .from('tribes')
        .delete()
        .eq('id', selectedTribe.id)
        .eq('created_by', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tribe deleted successfully"
      });

      setShowDeleteDialog(false);
      setSelectedTribe(null);
      setCurrentView('list');
      loadTribes();
    } catch (error: any) {
      console.error('Error deleting tribe:', error);
      toast({
        title: "Error",
        description: "Failed to delete tribe",
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
                <label className="text-sm font-medium">Tribe Name *</label>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  placeholder="Enter tribe name"
                  maxLength={50}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                  placeholder="Describe your tribe..."
                  maxLength={200}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Photo URL</label>
                <Input
                  value={createForm.photo_url}
                  onChange={(e) => setCreateForm({...createForm, photo_url: e.target.value})}
                  placeholder="https://example.com/photo.jpg"
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

  if (currentView === 'members' && selectedTribe) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
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
              <CardTitle className="flex items-center justify-between">
                <span>{selectedTribe.name} Members</span>
                {selectedTribe.is_owner && (
                  <Button
                    size="sm"
                    onClick={() => setCurrentView('edit')}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Tribe
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedTribe.is_owner && (
                <div className="flex gap-2">
                  <Input
                    value={addMemberCode}
                    onChange={(e) => setAddMemberCode(e.target.value)}
                    placeholder="Enter friend's personal code"
                  />
                  <Button onClick={addMember}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                {tribeMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                    <div>
                      <p className="font-medium">{member.profiles?.display_name || 'Unknown User'}</p>
                      <p className="text-sm text-muted-foreground">{member.profiles?.personal_code}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.role === 'owner' && (
                        <Badge variant="default">
                          <Crown className="h-3 w-3 mr-1" />
                          Owner
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => setCurrentView('messages')}
                className="w-full"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                View Messages
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentView === 'messages' && selectedTribe) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setCurrentView('members')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Members
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>{selectedTribe.name} Messages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-96 overflow-y-auto space-y-3 p-3 border rounded-lg">
                {tribeMessages.length === 0 ? (
                  <p className="text-center text-muted-foreground">No messages yet</p>
                ) : (
                  tribeMessages.map((message) => (
                    <div key={message.id} className="p-3 bg-accent rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-sm">
                          {message.profiles?.display_name || 'Unknown User'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button onClick={sendMessage}>Send</Button>
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
              <span className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                My Tribes
              </span>
              <Button
                onClick={() => setCurrentView('create')}
                disabled={tribes.filter(t => t.is_owner).length >= 5}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Tribe
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading tribes...</div>
            ) : tribes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No tribes yet</p>
                <p className="text-sm">Create your first tribe to connect with friends!</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {tribes.map((tribe) => (
                  <Card key={tribe.id} className="cursor-pointer hover:bg-accent">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold">{tribe.name}</h3>
                          {tribe.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {tribe.description}
                            </p>
                          )}
                        </div>
                        {tribe.is_owner && (
                          <Badge variant="default" className="ml-2">
                            <Crown className="h-3 w-3 mr-1" />
                            Owner
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {tribe.member_count} member{tribe.member_count !== 1 ? 's' : ''}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTribe(tribe);
                              setCurrentView('members');
                            }}
                          >
                            View
                          </Button>
                          {tribe.is_owner && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTribe(tribe);
                                setShowDeleteDialog(true);
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {tribes.filter(t => t.is_owner).length >= 5 && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  You've reached the maximum of 5 tribes you can create.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Tribe</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete this tribe? This action cannot be undone and all messages will be lost.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={deleteTribe}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default UserTribes;