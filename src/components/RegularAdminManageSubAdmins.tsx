import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useBackground } from '@/contexts/BackgroundContext';
import { User } from '@supabase/supabase-js';
import { ArrowLeft, UserPlus, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface RegularAdminManageSubAdminsProps {
  user: User;
  onBack: () => void;
}

interface SubAdmin {
  id: string;
  user_id: string;
  admin_level: string;
  allowed_tiles: string[];
  email?: string;
}

const availableTiles = [
  { id: 'registered-users', label: 'Registered Users' },
  { id: 'guest-list', label: 'Guest List' },
  { id: 'parties', label: 'Parties' },
  { id: 'messages', label: 'Messages' },
  { id: 'games', label: 'Games' },
  { id: 'bar-tabs', label: 'Bar Tabs' },
];

const RegularAdminManageSubAdmins = ({ user, onBack }: RegularAdminManageSubAdminsProps) => {
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();

  useEffect(() => {
    loadSubAdmins();
  }, [user.id]);

  const loadSubAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_profiles')
        .select(`
          id,
          user_id,
          admin_level,
          allowed_tiles,
          created_by
        `)
        .eq('created_by', user.id);

      if (error) throw error;

      // Get emails for sub-admins
      const profilesData = await Promise.all(
        (data || []).map(async (admin) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('user_id', admin.user_id)
            .single();
          return { ...admin, email: profile?.email };
        })
      );

      setSubAdmins(profilesData);
    } catch (error) {
      console.error('Error loading sub-admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateUniquePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const createSubAdminPassword = async () => {
    if (!newAdminEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }

    if (selectedTiles.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one permission",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const uniquePassword = generateUniquePassword();

      const { error } = await supabase
        .from('admin_passwords')
        .insert({
          admin_email: newAdminEmail,
          unique_password: uniquePassword,
          created_by: user.id,
          is_used: false,
          allowed_tiles: selectedTiles
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Sub-admin password created for ${newAdminEmail}. Password: ${uniquePassword}`,
      });

      setNewAdminEmail('');
      setSelectedTiles([]);
      loadSubAdmins();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteSubAdmin = async (subAdminId: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} as a sub-admin?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_profiles')
        .delete()
        .eq('id', subAdminId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${email} has been removed as a sub-admin`,
      });

      loadSubAdmins();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleTile = (tileId: string) => {
    setSelectedTiles(prev =>
      prev.includes(tileId)
        ? prev.filter(id => id !== tileId)
        : [...prev, tileId]
    );
  };

  return (
    <div
      className="min-h-screen p-4 transition-colors duration-500"
      style={{ backgroundColor }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold" style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}>
            Manage Sub-Admins
          </h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create Sub-Admin Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="Sub-admin email address"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
              />

              <div className="space-y-2">
                <p className="text-sm font-medium">Select Permissions:</p>
                <div className="grid grid-cols-2 gap-4">
                  {availableTiles.map((tile) => (
                    <div key={tile.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={tile.id}
                        checked={selectedTiles.includes(tile.id)}
                        onCheckedChange={() => toggleTile(tile.id)}
                      />
                      <label
                        htmlFor={tile.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {tile.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={createSubAdminPassword} disabled={loading} className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Create Sub-Admin Password
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Sub-Admins</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : subAdmins.length === 0 ? (
              <p className="text-muted-foreground">No sub-admins yet</p>
            ) : (
              <div className="space-y-4">
                {subAdmins.map((admin) => (
                  <Card key={admin.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{admin.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Permissions: {admin.allowed_tiles.join(', ')}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteSubAdmin(admin.id, admin.email || '')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegularAdminManageSubAdmins;
