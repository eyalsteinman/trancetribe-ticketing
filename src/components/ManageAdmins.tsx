import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Trash2, Edit, UserPlus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ManageAdminsProps {
  onBack: () => void;
}

interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

const ManageAdmins = ({ onBack }: ManageAdminsProps) => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [editingAdmin, setEditingAdmin] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      
      // Get all users with admin role by first getting the role records
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) {
        console.error('Error loading admin roles:', rolesError);
        toast({
          title: "Error",
          description: "Failed to load admin list",
          variant: "destructive"
        });
        return;
      }

      if (!adminRoles || adminRoles.length === 0) {
        setAdmins([]);
        return;
      }

      // Get profiles for admin users including email
      const adminUserIds = adminRoles.map(role => role.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, first_name, last_name, created_at')
        .in('user_id', adminUserIds);

      if (profilesError) {
        console.error('Error loading admin profiles:', profilesError);
        toast({
          title: "Error",
          description: "Failed to load admin profiles",
          variant: "destructive"
        });
        return;
      }

      // Transform the data to match our interface
      const adminUsers: AdminUser[] = (profilesData || []).map(profile => ({
        id: profile.user_id,
        email: profile.email || 'No email',
        display_name: profile.display_name || 
                     (profile.first_name && profile.last_name 
                       ? `${profile.first_name} ${profile.last_name}`
                       : profile.email?.split('@')[0] || 'Unknown Admin'),
        created_at: profile.created_at || new Date().toISOString()
      }));

      setAdmins(adminUsers);
    } catch (error) {
      console.error('Error loading admins:', error);
      toast({
        title: "Error",
        description: "Failed to load admin list",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewAdmin = async () => {
    if (!newAdminEmail.trim() || !newAdminPassword.trim()) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Creating admin user with email:', newAdminEmail);
      
      // Get current session token for authorization
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to create admins",
          variant: "destructive"
        });
        return;
      }
      
      console.log('Calling create-admin edge function...');
      
      // Call edge function to create admin with email verification bypassed
      const { data, error } = await supabase.functions.invoke('create-admin', {
        body: {
          email: newAdminEmail,
          password: newAdminPassword
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Edge function response:', { data, error });
      
      // Log more detailed error information
      if (error) {
        console.error('Detailed error:', {
          name: error.name,
          message: error.message,
          context: error.context,
          details: error.details
        });
      }

      if (error) {
        console.error('Edge function error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to create admin",
          variant: "destructive"
        });
        return;
      }

      if (data && data.success) {
        toast({
          title: "Success",
          description: "New admin created successfully! They can login immediately without email verification.",
        });
        setNewAdminEmail('');
        setNewAdminPassword('');
        loadAdmins();
      } else {
        const errorMsg = data?.error || "Unknown error occurred";
        console.error('Admin creation failed:', errorMsg);
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      toast({
        title: "Error",
        description: "Failed to create new admin. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to delete this admin?')) {
      return;
    }

    setLoading(true);
    try {
      // Remove admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', adminId)
        .eq('role', 'admin');

      if (roleError) {
        toast({
          title: "Error",
          description: "Failed to remove admin role",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Admin removed successfully",
      });
      loadAdmins();
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast({
        title: "Error",
        description: "Failed to delete admin",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAdminEmail = async (adminId: string) => {
    if (!editEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid email",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Update profile display name to match email
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: editEmail.split('@')[0]
        })
        .eq('user_id', adminId);

      if (profileError) {
        toast({
          title: "Error",
          description: "Failed to update admin profile",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Admin updated successfully",
      });
      setEditingAdmin(null);
      setEditEmail('');
      loadAdmins();
    } catch (error) {
      console.error('Error updating admin:', error);
      toast({
        title: "Error",
        description: "Failed to update admin",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Manage Admins</h1>
        </div>

        <Alert>
          <AlertDescription>
            Here you can manage admin users. New admins are created without email verification and can access the admin panel immediately.
          </AlertDescription>
        </Alert>

        {/* Create New Admin */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New Admin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </div>
            </div>
            <Button onClick={createNewAdmin} disabled={loading} className="w-full">
              {loading ? 'Creating...' : 'Create Admin'}
            </Button>
          </CardContent>
        </Card>

        {/* Admin List */}
        <Card>
          <CardHeader>
            <CardTitle>Current Admins</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && admins.length === 0 ? (
              <div className="text-center py-4">Loading admins...</div>
            ) : admins.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No admins found
              </div>
            ) : (
              <div className="space-y-3">
                {admins.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      {editingAdmin === admin.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            placeholder="New display name"
                            className="max-w-xs"
                          />
                          <Button
                            size="sm"
                            onClick={() => updateAdminEmail(admin.id)}
                            disabled={loading}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingAdmin(null);
                              setEditEmail('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium">{admin.display_name}</div>
                          <div className="text-sm text-muted-foreground">{admin.email}</div>
                          <div className="text-xs text-muted-foreground">Admin</div>
                        </div>
                      )}
                    </div>
                    
                    {editingAdmin !== admin.id && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingAdmin(admin.id);
                            setEditEmail(admin.display_name);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteAdmin(admin.id)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManageAdmins;