import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useBackground } from '@/contexts/BackgroundContext';
import { ArrowLeft, UserPlus, Eye, Key } from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface SuperAdminManageAdminsProps {
  user: User;
  onBack: () => void;
  onViewAdminDashboard: (adminId: string) => void;
}

interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  admin_level: string;
  is_super_admin: boolean;
}

interface PendingPassword {
  id: string;
  admin_email: string;
  unique_password: string;
  expires_at: string;
  is_used: boolean;
}

const SuperAdminManageAdmins = ({ user, onBack, onViewAdminDashboard }: SuperAdminManageAdminsProps) => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [pendingPasswords, setPendingPasswords] = useState<PendingPassword[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [generatingPassword, setGeneratingPassword] = useState(false);
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();

  useEffect(() => {
    loadAdmins();
    loadPendingPasswords();
  }, []);

  const loadAdmins = async () => {
    try {
      // Get all users with admin role
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) {
        console.error('Error loading admin roles:', rolesError);
        setLoading(false);
        return;
      }

      if (!adminRoles || adminRoles.length === 0) {
        setAdmins([]);
        setLoading(false);
        return;
      }

      const adminUserIds = adminRoles.map(r => r.user_id);

      // Get profiles for these admin users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          email,
          display_name,
          created_at
        `)
        .in('user_id', adminUserIds);

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        setLoading(false);
        return;
      }

      // Get admin profiles
      const { data: adminProfiles, error: adminProfilesError } = await supabase
        .from('admin_profiles')
        .select('user_id, admin_level, is_super_admin, role')
        .in('user_id', adminUserIds);

      if (adminProfilesError) {
        console.error('Error loading admin profiles:', adminProfilesError);
      }

      // Merge the data
      const formattedAdmins = profiles?.map((profile: any) => {
        const adminProfile = adminProfiles?.find(ap => ap.user_id === profile.user_id);
        return {
          id: profile.user_id,
          email: profile.email,
          display_name: profile.display_name || profile.email,
          created_at: profile.created_at,
          admin_level: adminProfile?.admin_level || 'level1',
          is_super_admin: adminProfile?.is_super_admin || false
        };
      }) || [];

      setAdmins(formattedAdmins);
    } catch (error) {
      console.error('Error loading admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingPasswords = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_passwords')
        .select('*')
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading pending passwords:', error);
        return;
      }

      setPendingPasswords(data || []);
    } catch (error) {
      console.error('Error loading pending passwords:', error);
    }
  };

  const generateUniquePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const createAdminPassword = async () => {
    if (!newAdminEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an admin email",
        variant: "destructive"
      });
      return;
    }

    setGeneratingPassword(true);
    try {
      const uniquePassword = generateUniquePassword();
      
      const { error } = await supabase
        .from('admin_passwords')
        .insert({
          admin_email: newAdminEmail.trim(),
          unique_password: uniquePassword,
          created_by: user.id
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create admin password",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Admin Password Created",
        description: `Password for ${newAdminEmail}: ${uniquePassword}`,
      });

      setNewAdminEmail('');
      loadPendingPasswords();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create admin password",
        variant: "destructive"
      });
    } finally {
      setGeneratingPassword(false);
    }
  };

  const deleteAdmin = async (adminId: string, adminEmail: string) => {
    try {
      // Remove admin profile
      await supabase
        .from('admin_profiles')
        .delete()
        .eq('user_id', adminId);

      // Remove admin role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', adminId)
        .eq('role', 'admin');

      toast({
        title: "Success",
        description: `Admin ${adminEmail} removed successfully`,
      });

      loadAdmins();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove admin",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen p-4 transition-colors duration-500 flex items-center justify-center"
        style={{ backgroundColor }}
      >
        <div className="text-center" style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}>
          Loading admins...
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-4 transition-colors duration-500"
      style={{ backgroundColor }}
    >
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 
            className="text-2xl font-bold"
            style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}
          >
            Manage Admins
          </h1>
          <Button variant="outline" size="icon" onClick={onBack} aria-label="Back" className="on-color back-button">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Create New Admin Password */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Create Admin Access Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="New admin email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={createAdminPassword}
                disabled={generatingPassword}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Generate Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pending Passwords */}
        {pendingPasswords.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Pending Admin Passwords</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pendingPasswords.map((password) => (
                  <div key={password.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{password.admin_email}</div>
                      <div className="text-sm text-muted-foreground">
                        Code stored securely — regenerate to issue a new one
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Expires: {new Date(password.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Admins */}
        <Card>
          <CardHeader>
            <CardTitle>Current Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {admins.map((admin) => (
                <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{admin.display_name}</div>
                    <div className="text-sm text-muted-foreground">{admin.email}</div>
                    <div className="text-xs text-muted-foreground">
                      Level: {admin.admin_level} {admin.is_super_admin && '(Super Admin)'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(admin.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewAdminDashboard(admin.id)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Dashboard
                    </Button>
                    {!admin.is_super_admin && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteAdmin(admin.id, admin.email)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {admins.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No admins found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminManageAdmins;