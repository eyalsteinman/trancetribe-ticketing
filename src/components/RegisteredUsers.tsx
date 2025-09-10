import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit2, Save, X, UserCheck, Shield, ArrowLeft, Users } from 'lucide-react';
import { useBackground } from '@/contexts/BackgroundContext';
import SocialDialog from './SocialDialog';

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

const RegisteredUsers = ({ onBack }: RegisteredUsersProps) => {
  const [users, setUsers] = useState<RegisteredUser[]>([]);
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
  
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();

  useEffect(() => {
    loadUsers();
  }, []);

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

  return (
  <div 
      className="min-h-screen p-4 transition-colors duration-500"
      style={{ 
        backgroundColor
      }}
    >
        <div className="max-w-4xl mx-auto space-y-6 text-left">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack} aria-label="Back" className="absolute top-4 right-4 z-[9999] on-color back-button">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 
            className="text-2xl font-bold absolute top-4 left-4"
            style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}
          >
            Registered Users
          </h1>
        </div>

        <div className="mt-24">
        <Card>
          <CardHeader>
            <CardTitle>All Registered Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No users found
              </div>
            ) : (
              <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
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
                    {users.map((user) => (
                      <tr key={user.user_id} className="border-b hover:bg-muted/50">
                        {editingUser === user.user_id ? (
                          <>
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
                                className="p-1"
                                title="View social media"
                              >
                                <Users className="h-4 w-4" />
                              </Button>
                            </td>
                            <td className="p-3">
                              <div className="flex flex-col gap-2">
                                <div className="flex flex-wrap gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => startEditing(user)}
                                    className="p-1"
                                    title="Edit user"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={user.roles.includes('user') ? 'default' : 'outline'}
                                    onClick={() => toggleRole(user.user_id, 'user')}
                                    className="p-1"
                                    title={user.roles.includes('user') ? 'Remove user role' : 'Add user role'}
                                  >
                                    <UserCheck className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={user.roles.includes('admin') ? 'default' : 'outline'}
                                    onClick={() => toggleRole(user.user_id, 'admin')}
                                    className="p-1"
                                    title={user.roles.includes('admin') ? 'Remove admin role' : 'Add admin role'}
                                  >
                                    <Shield className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => deleteUser(user.user_id)}
                                    className="p-1 bg-red-600 hover:bg-red-700 border-red-600 text-white hover:text-white"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                                  <span>Edit</span>
                                  <span>User Role</span>
                                  <span>Admin Role</span>
                                  <span>Delete</span>
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
      </div>
    </div>
  );
};

export default RegisteredUsers;