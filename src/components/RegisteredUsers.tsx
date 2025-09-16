import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit2, Save, X, UserCheck, Shield, Users, Search, Send, Gift, Tag } from 'lucide-react';
import PageHeader from '@/components/ui/page-header';
import { useBackground } from '@/contexts/BackgroundContext';
import SocialDialog from './SocialDialog';
import Footer from '@/components/ui/footer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface RegisteredUsersProps {
  onBack: () => void;
}

interface RegisteredUser {
  id: string;
  user_id: string;
  display_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  created_at: string;
  roles: string[];
}

interface Party {
  id: string;
  name: string;
  date: string;
}

interface TicketOfferForm {
  partyId: string;
  messageSubject: string;
  messageContent: string;
  ticketType: 'free' | 'discounted';
  originalPrice: number;
  discountedPrice: number;
}

const RegisteredUsers = ({ onBack }: RegisteredUsersProps) => {
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<RegisteredUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: ''
  });
  const [socialDialog, setSocialDialog] = useState<{open: boolean; userId: string; socials: any[]}>({
    open: false,
    userId: '',
    socials: []
  });
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<'name' | 'email' | 'phone'>('name');
  
  // Selection functionality
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  
  // Messaging functionality
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [parties, setParties] = useState<Party[]>([]);
  const [messageForm, setMessageForm] = useState<TicketOfferForm>({
    partyId: '',
    messageSubject: '',
    messageContent: '',
    ticketType: 'free',
    originalPrice: 0,
    discountedPrice: 0
  });
  
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();

  useEffect(() => {
    loadUsers();
    loadParties();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, searchField]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error loading users:', profilesError);
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive"
        });
        return;
      }

      // Then get all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Error loading user roles:', rolesError);
        toast({
          title: "Error",
          description: "Failed to load user roles",
          variant: "destructive"
        });
        return;
      }

      // Combine profiles with their roles
      const usersWithRoles = (profiles || []).map(profile => {
        const userRolesList = (userRoles || [])
          .filter(role => role.user_id === profile.user_id)
          .map(role => role.role);
        
        return {
          ...profile,
          roles: userRolesList
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadParties = async () => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) return;

      const { data, error } = await supabase
        .from('parties')
        .select('id, name, date')
        .eq('created_by', currentUser.user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setParties(data || []);
    } catch (error) {
      console.error('Error loading parties:', error);
    }
  };

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(user => {
      switch (searchField) {
        case 'name':
          return (user.first_name?.toLowerCase().includes(query)) ||
                 (user.last_name?.toLowerCase().includes(query)) ||
                 (user.display_name?.toLowerCase().includes(query));
        case 'email':
          return user.email?.toLowerCase().includes(query);
        case 'phone':
          return user.phone_number?.includes(query);
        default:
          return false;
      }
    });
    setFilteredUsers(filtered);
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('Attempting to delete user:', userId);
      
      // Call the delete-user edge function
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: {
          userId: userId
        }
      });

      console.log('Delete user response:', { data, error });

      if (error) {
        throw error;
      }

      if (data && !data.success) {
        throw new Error(data.error || 'Failed to delete user');
      }

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      
      loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user: " + error.message,
        variant: "destructive"
      });
    }
  };

  const startEditing = (user: RegisteredUser) => {
    setEditingUser(user.user_id);
    setEditForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone_number: user.phone_number || ''
    });
  };

  const saveEdit = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          email: editForm.email,
          phone_number: editForm.phone_number,
          display_name: `${editForm.first_name} ${editForm.last_name}`.trim()
        })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      });
      
      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user: " + error.message,
        variant: "destructive"
      });
    }
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setEditForm({
      first_name: '',
      last_name: '',
      email: '',
      phone_number: ''
    });
  };

  const toggleRole = async (userId: string, role: 'user' | 'admin') => {
    try {
      const user = users.find(u => u.user_id === userId);
      if (!user) return;

      const hasRole = user.roles.includes(role);
      
      if (hasRole) {
        // Remove role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role);

        if (error) throw error;

        toast({
          title: "Success",
          description: `${role} role removed successfully`,
        });
      } else {
        // Add role
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: role
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: `${role} role added successfully`,
        });
      }

      loadUsers();
    } catch (error: any) {
      console.error('Error toggling role:', error);
      toast({
        title: "Error",
        description: "Failed to update role: " + error.message,
        variant: "destructive"
      });
    }
  };

  const viewSocialMedia = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_socials')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      setSocialDialog({
        open: true,
        userId,
        socials: data || []
      });
    } catch (error: any) {
      console.error('Error loading social media:', error);
      toast({
        title: "Error",
        description: "Failed to load social media information",
        variant: "destructive"
      });
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const selectAllUsers = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(user => user.user_id)));
    }
  };

  const sendTicketOffers = async () => {
    if (selectedUsers.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one user",
        variant: "destructive"
      });
      return;
    }

    if (!messageForm.partyId || !messageForm.messageSubject || !messageForm.messageContent) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const party = parties.find(p => p.id === messageForm.partyId);
      if (!party) return;

      const selectedUsersList = Array.from(selectedUsers);
      
      for (const userId of selectedUsersList) {
        const user = users.find(u => u.user_id === userId);
        if (!user) continue;

        let messageContent = messageForm.messageContent;
        
        if (messageForm.ticketType === 'free') {
          // Generate free QR code
          const qrData = `${userId}-${messageForm.partyId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          const { error: qrError } = await supabase
            .from('qr_codes')
            .insert({
              user_id: userId,
              party_id: messageForm.partyId,
              code: qrData,
              is_approved: true,
              auto_approved: true
            });

          if (qrError) {
            console.error('Error creating QR code:', qrError);
            continue;
          }

          messageContent += `\n\n🎫 FREE TICKET GRANTED!\nYour QR code: ${qrData}\nShow this at the entrance to gain access.`;
        } else {
          // Discounted ticket
          const qrData = `DISCOUNT-${userId}-${messageForm.partyId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          messageContent += `\n\n🏷️ SPECIAL DISCOUNT OFFER!\nOriginal Price: ₪${messageForm.originalPrice}\nYour Price: ₪${messageForm.discountedPrice}\nSavings: ₪${messageForm.originalPrice - messageForm.discountedPrice}\n\nClick "Purchase" to buy at the discounted price!\nDiscount Code: ${qrData}`;
        }

        // Send message
        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            recipient_id: userId,
            subject: messageForm.messageSubject,
            content: messageContent,
            production_id: null,
            created_by: (await supabase.auth.getUser()).data.user?.id
          });

        if (messageError) {
          console.error('Error sending message:', messageError);
        }
      }

      toast({
        title: "Success",
        description: `Ticket offers sent to ${selectedUsersList.length} users`,
      });

      setShowMessageForm(false);
      setSelectedUsers(new Set());
      setMessageForm({
        partyId: '',
        messageSubject: '',
        messageContent: '',
        ticketType: 'free',
        originalPrice: 0,
        discountedPrice: 0
      });

    } catch (error: any) {
      console.error('Error sending ticket offers:', error);
      toast({
        title: "Error",
        description: "Failed to send ticket offers: " + error.message,
        variant: "destructive"
      });
    }
  };

  return (
  <div 
      className="min-h-screen p-4 transition-colors duration-500"
      style={{ 
        backgroundColor
      }}
    >
        <div className="max-w-4xl mx-auto space-y-6 text-left">
        <PageHeader
          title="Registered Users"
          onBack={onBack}
        />

        {/* Search Bar */}
        <Card>
          <CardHeader>
            <CardTitle>User Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium">Search Field</label>
                <Select value={searchField} onValueChange={(value: 'name' | 'email' | 'phone') => setSearchField(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-2">
                <label className="text-sm font-medium">Search Query</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`Search by ${searchField}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selection and Messaging */}
        {filteredUsers.length > 0 && (
          <Card>
            <CardHeader>
              <div className="space-y-3">
                <CardTitle>User Selection ({selectedUsers.size} selected)</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllUsers}
                    className="w-full sm:w-auto"
                  >
                    {selectedUsers.size === filteredUsers.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Dialog open={showMessageForm} onOpenChange={setShowMessageForm}>
                    <DialogTrigger asChild>
                      <Button
                        disabled={selectedUsers.size === 0}
                        className="flex items-center gap-2 w-full sm:w-auto"
                        size="sm"
                      >
                        <Send className="h-4 w-4" />
                        Send Ticket Offers
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-lg">Send Ticket Offers to {selectedUsers.size} Users</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pr-2">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Select Party</label>
                          <Select value={messageForm.partyId} onValueChange={(value) => setMessageForm({...messageForm, partyId: value})}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Choose a party..." />
                            </SelectTrigger>
                            <SelectContent>
                              {parties.map(party => (
                                <SelectItem key={party.id} value={party.id}>
                                  <div className="text-sm">
                                    <div className="font-medium">{party.name}</div>
                                    <div className="text-muted-foreground">{new Date(party.date).toLocaleDateString()}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-1 block">Message Subject</label>
                          <Input
                            value={messageForm.messageSubject}
                            onChange={(e) => setMessageForm({...messageForm, messageSubject: e.target.value})}
                            placeholder="Enter message subject..."
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-1 block">Message Content</label>
                          <Textarea
                            value={messageForm.messageContent}
                            onChange={(e) => setMessageForm({...messageForm, messageContent: e.target.value})}
                            placeholder="Enter your message..."
                            rows={3}
                            className="w-full resize-none"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-1 block">Ticket Type</label>
                          <Select value={messageForm.ticketType} onValueChange={(value: 'free' | 'discounted') => setMessageForm({...messageForm, ticketType: value})}>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">
                                <div className="flex items-center gap-2">
                                  <Gift className="h-4 w-4" />
                                  Free Ticket
                                </div>
                              </SelectItem>
                              <SelectItem value="discounted">
                                <div className="flex items-center gap-2">
                                  <Tag className="h-4 w-4" />
                                  Discounted Ticket
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {messageForm.ticketType === 'discounted' && (
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium mb-1 block">Original Price (₪)</label>
                              <Input
                                type="number"
                                value={messageForm.originalPrice || ''}
                                onChange={(e) => setMessageForm({...messageForm, originalPrice: Number(e.target.value)})}
                                placeholder="0"
                                className="w-full"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-1 block">Discounted Price (₪)</label>
                              <Input
                                type="number"
                                value={messageForm.discountedPrice || ''}
                                onChange={(e) => setMessageForm({...messageForm, discountedPrice: Number(e.target.value)})}
                                placeholder="0"
                                className="w-full"
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 justify-end pt-4 border-t">
                          <Button
                            variant="outline"
                            onClick={() => setShowMessageForm(false)}
                            size="sm"
                          >
                            Cancel
                          </Button>
                          <Button onClick={sendTicketOffers} size="sm">
                            Send Offers
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>All Registered Users ({filteredUsers.length} shown of {users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                {users.length === 0 ? 'No users found' : 'No users match your search'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">
                          <Checkbox
                            checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                            onCheckedChange={selectAllUsers}
                          />
                        </th>
                        <th className="text-left p-3 font-medium">First Name</th>
                        <th className="text-left p-3 font-medium">Last Name</th>
                        <th className="text-left p-3 font-medium">Email</th>
                        <th className="text-left p-3 font-medium">Phone</th>
                        <th className="text-left p-3 font-medium">Roles</th>
                        <th className="text-left p-3 font-medium">Registered</th>
                        <th className="text-left p-3 font-medium">Social Profiles</th>
                        <th className="text-left p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                   <tbody>
                     {filteredUsers.map((user) => (
                       <tr key={user.user_id} className="border-b hover:bg-muted/50">
                          {editingUser === user.user_id ? (
                            <>
                              <td className="p-3">
                                <Checkbox
                                  checked={selectedUsers.has(user.user_id)}
                                  onCheckedChange={() => toggleUserSelection(user.user_id)}
                                />
                              </td>
                            <td className="p-3">
                              <Input
                                value={editForm.first_name}
                                onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                                placeholder="First Name"
                                className="w-full"
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                value={editForm.last_name}
                                onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                                placeholder="Last Name"
                                className="w-full"
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                value={editForm.email}
                                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                placeholder="Email"
                                type="email"
                                className="w-full"
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                value={editForm.phone_number}
                                onChange={(e) => setEditForm({...editForm, phone_number: e.target.value})}
                                placeholder="Phone Number"
                                type="tel"
                                className="w-full"
                              />
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1">
                                {user.roles.map(role => (
                                  <Badge key={role} variant={role === 'admin' ? 'default' : 'secondary'}>
                                    {role}
                                  </Badge>
                                ))}
                                {user.roles.length === 0 && (
                                  <span className="text-sm text-muted-foreground">No roles</span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-sm text-muted-foreground">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => viewSocialMedia(user.user_id)}
                                className="p-1"
                                title="View social media"
                              >
                                <Users className="h-4 w-4" />
                              </Button>
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => saveEdit(user.user_id)}
                                  className="p-2"
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEdit}
                                  className="p-2"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </>
                         ) : (
                           <>
                             <td className="p-3">
                               <Checkbox
                                 checked={selectedUsers.has(user.user_id)}
                                 onCheckedChange={() => toggleUserSelection(user.user_id)}
                               />
                             </td>
                             <td className="p-3">{user.first_name || 'N/A'}</td>
                            <td className="p-3">{user.last_name || 'N/A'}</td>
                            <td className="p-3 text-sm">{user.email || 'N/A'}</td>
                            <td className="p-3 text-sm">{user.phone_number || 'N/A'}</td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1">
                                {user.roles.map(role => (
                                  <Badge key={role} variant={role === 'admin' ? 'default' : 'secondary'}>
                                    {role}
                                  </Badge>
                                ))}
                                {user.roles.length === 0 && (
                                  <span className="text-sm text-muted-foreground">No roles</span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-sm text-muted-foreground">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                             <td className="p-3">
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => viewSocialMedia(user.user_id)}
                                 className="p-1 border-foreground/20 bg-background/50 backdrop-blur-sm text-foreground hover:bg-foreground/10"
                                 title="View social media"
                               >
                                 <Users className="h-4 w-4" />
                               </Button>
                             </td>
                            <td className="p-3">
                              <div className="flex justify-start gap-6">
                                <div className="flex w-20 flex-col items-center">
                                   <Button
                                     size="sm"
                                     variant="outline"
                                     onClick={() => startEditing(user)}
                                     className="p-2 border-foreground/20 bg-background/50 backdrop-blur-sm text-foreground hover:bg-foreground/10"
                                     title="Edit user"
                                     aria-label="Edit user"
                                   >
                                     <Edit2 className="h-4 w-4" />
                                   </Button>
                                  <span className="mt-1 text-xs text-muted-foreground text-center">Edit</span>
                                </div>
                                <div className="flex w-20 flex-col items-center">
                                   <Button
                                     size="sm"
                                     variant={user.roles.includes('user') ? 'default' : 'outline'}
                                     onClick={() => toggleRole(user.user_id, 'user')}
                                     className={`p-2 ${!user.roles.includes('user') ? 'border-foreground/20 bg-background/50 backdrop-blur-sm text-foreground hover:bg-foreground/10' : ''}`}
                                     title={user.roles.includes('user') ? 'Remove user role' : 'Add user role'}
                                     aria-label="Toggle user role"
                                   >
                                     <UserCheck className="h-4 w-4" />
                                   </Button>
                                  <span className="mt-1 text-xs text-muted-foreground text-center">User</span>
                                </div>
                                <div className="flex w-20 flex-col items-center">
                                   <Button
                                     size="sm"
                                     variant={user.roles.includes('admin') ? 'default' : 'outline'}
                                     onClick={() => toggleRole(user.user_id, 'admin')}
                                     className={`p-2 ${!user.roles.includes('admin') ? 'border-foreground/20 bg-background/50 backdrop-blur-sm text-foreground hover:bg-foreground/10' : ''}`}
                                     title={user.roles.includes('admin') ? 'Remove admin role' : 'Add admin role'}
                                     aria-label="Toggle admin role"
                                   >
                                     <Shield className="h-4 w-4" />
                                   </Button>
                                  <span className="mt-1 text-xs text-muted-foreground text-center">Admin</span>
                                </div>
                                <div className="flex w-20 flex-col items-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => deleteUser(user.user_id)}
                                    className="p-2 bg-red-600 hover:bg-red-700 border-red-600 text-white hover:text-white"
                                    aria-label="Delete user"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  <span className="mt-1 text-xs text-muted-foreground text-center">Delete</span>
                                </div>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
        
        <SocialDialog
          open={socialDialog.open}
          onOpenChange={(open) => setSocialDialog(prev => ({ ...prev, open }))}
          socials={socialDialog.socials}
        />
        
        <Footer />
      </div>
    </div>
  );
};

export default RegisteredUsers;