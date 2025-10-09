import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useBackground } from '@/contexts/BackgroundContext';
import { User } from '@supabase/supabase-js';
import { ArrowLeft, UserPlus, Trash2, Copy, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  role?: string;
}

interface PendingPassword {
  id: string;
  admin_email: string;
  unique_password: string;
  is_used: boolean;
  created_at: string;
  expires_at: string;
  allowed_tiles: string[];
}

const availableTiles = [
  { id: 'my-info', label: 'My Info' },
  { id: 'manage-users', label: 'Manage Users' },
  { id: 'manage-parties', label: 'Manage Parties' },
  { id: 'manage-productions', label: 'Manage Productions' },
  { id: 'manage-bar-tabs', label: 'Manage Bar Tabs' },
  { id: 'manage-qr', label: 'Manage QR Codes' },
  { id: 'manage-messages', label: 'Manage Messages' },
  { id: 'manage-games', label: 'Manage Games' },
  { id: 'manage-faq', label: 'Manage FAQ' },
  { id: 'registered-users', label: 'Registered Users' },
  { id: 'guest-list', label: 'Guest List' },
  { id: 'social-networks', label: 'Social Networks' },
  { id: 'send-email', label: 'Send Email' },
  { id: 'impersonation', label: 'Impersonation' },
  { id: 'vip-hub', label: 'VIP Hub' },
  { id: 'qr-scanner', label: 'QR Scanner' },
  { id: 'bartab-scanner', label: 'Bar Tab Scanner' },
];

const RegularAdminManageSubAdmins = ({ user, onBack }: RegularAdminManageSubAdminsProps) => {
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [pendingPasswords, setPendingPasswords] = useState<PendingPassword[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('');
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);
  const [selectAllTiles, setSelectAllTiles] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [editingSubAdmin, setEditingSubAdmin] = useState<string | null>(null);
  const [editingTiles, setEditingTiles] = useState<string[]>([]);
  const [editingRole, setEditingRole] = useState<string>('');
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();

  useEffect(() => {
    loadSubAdmins();
    loadPendingPasswords();
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
          created_by,
          role
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

  const loadPendingPasswords = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_passwords')
        .select('*')
        .eq('created_by', user.id)
        .eq('is_used', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPendingPasswords(data || []);
    } catch (error) {
      console.error('Error loading pending passwords:', error);
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
      // Check if there's an existing unused password for this email
      const { data: existingPassword } = await supabase
        .from('admin_passwords')
        .select('id')
        .eq('admin_email', newAdminEmail)
        .eq('created_by', user.id)
        .eq('is_used', false)
        .maybeSingle();

      const uniquePassword = generateUniquePassword();

      if (existingPassword) {
        // Update existing password
        const { error } = await supabase
          .from('admin_passwords')
          .update({
            unique_password: uniquePassword,
            allowed_tiles: selectedTiles,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Reset expiry to 7 days from now
          })
          .eq('id', existingPassword.id);

        if (error) throw error;
      } else {
        // Create new password
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
      }

      setGeneratedPassword(uniquePassword);
      setGeneratedEmail(newAdminEmail);
      setShowPasswordDialog(true);
      setCopied(false);

      setNewAdminEmail('');
      setNewAdminRole('');
      setSelectedTiles([]);
      setSelectAllTiles(false);
      loadSubAdmins();
      loadPendingPasswords();
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

  const toggleSelectAll = () => {
    if (selectAllTiles) {
      setSelectedTiles([]);
      setSelectAllTiles(false);
    } else {
      setSelectedTiles(availableTiles.map(t => t.id));
      setSelectAllTiles(true);
    }
  };

  useEffect(() => {
    setSelectAllTiles(selectedTiles.length === availableTiles.length);
  }, [selectedTiles]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Password copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy password",
        variant: "destructive"
      });
    }
  };

  const copyPasswordToClipboard = async (password: string) => {
    try {
      await navigator.clipboard.writeText(password);
      toast({
        title: "Copied!",
        description: "Password copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy password",
        variant: "destructive"
      });
    }
  };

  const regeneratePassword = async (pendingId: string, email: string, allowedTiles: string[]) => {
    try {
      // Delete old password
      await supabase
        .from('admin_passwords')
        .delete()
        .eq('id', pendingId);

      // Generate new password
      const uniquePassword = generateUniquePassword();

      const { error } = await supabase
        .from('admin_passwords')
        .insert({
          admin_email: email,
          unique_password: uniquePassword,
          created_by: user.id,
          is_used: false,
          allowed_tiles: allowedTiles
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "New password generated successfully",
      });

      loadPendingPasswords();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const startEditingSubAdmin = (admin: SubAdmin) => {
    setEditingSubAdmin(admin.id);
    setEditingTiles(admin.allowed_tiles);
    setEditingRole(admin.role || '');
  };

  const cancelEditingSubAdmin = () => {
    setEditingSubAdmin(null);
    setEditingTiles([]);
    setEditingRole('');
  };

  const saveSubAdminPermissions = async (adminId: string) => {
    try {
      const { error } = await supabase
        .from('admin_profiles')
        .update({ 
          allowed_tiles: editingTiles,
          role: editingRole || null
        })
        .eq('id', adminId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Permissions updated successfully",
      });

      setEditingSubAdmin(null);
      setEditingTiles([]);
      setEditingRole('');
      loadSubAdmins();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleEditingTile = (tileId: string) => {
    setEditingTiles(prev =>
      prev.includes(tileId)
        ? prev.filter(id => id !== tileId)
        : [...prev, tileId]
    );
  };

  const deletePendingPassword = async (pendingId: string) => {
    try {
      const { error } = await supabase
        .from('admin_passwords')
        .delete()
        .eq('id', pendingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Pending password deleted",
      });

      loadPendingPasswords();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
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

              <Input
                type="text"
                placeholder="Role (e.g., Event Manager, Scanner Operator)"
                value={newAdminRole}
                onChange={(e) => setNewAdminRole(e.target.value)}
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Select Permissions:</p>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all"
                      checked={selectAllTiles}
                      onCheckedChange={toggleSelectAll}
                    />
                    <label
                      htmlFor="select-all"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Select All
                    </label>
                  </div>
                </div>
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

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pending Sub-Admins</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : pendingPasswords.length === 0 ? (
              <p className="text-muted-foreground">No pending passwords</p>
            ) : (
              <div className="space-y-4">
                {pendingPasswords.map((pending) => {
                  const isExpired = new Date(pending.expires_at) < new Date();
                  const isUsed = pending.is_used;
                  
                  return (
                    <Card key={pending.id} className={isExpired || isUsed ? 'opacity-60' : ''}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{pending.admin_email}</p>
                            <p className="text-sm text-muted-foreground">
                              Created: {new Date(pending.created_at).toLocaleDateString()}
                            </p>
                            {isExpired && (
                              <p className="text-sm text-destructive">⚠️ Expired</p>
                            )}
                            {isUsed && (
                              <p className="text-sm text-muted-foreground">✓ Used</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {!isUsed && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => regeneratePassword(pending.id, pending.admin_email, pending.allowed_tiles)}
                              >
                                Regenerate
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deletePendingPassword(pending.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-xs text-muted-foreground mb-2">Password:</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 bg-background p-2 rounded text-sm font-mono break-all">
                              {pending.unique_password}
                            </code>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => copyPasswordToClipboard(pending.unique_password)}
                              title="Copy to clipboard"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Permissions: {pending.allowed_tiles.join(', ')}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
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
                    <CardContent className="p-4">
                      {editingSubAdmin === admin.id ? (
                        <div className="space-y-4">
                          <div>
                            <p className="font-medium mb-2">{admin.email}</p>
                            <Input
                              type="text"
                              placeholder="Role (e.g., Event Manager)"
                              value={editingRole}
                              onChange={(e) => setEditingRole(e.target.value)}
                              className="mb-3"
                            />
                            <p className="text-sm font-medium mb-2">Edit Permissions:</p>
                            <div className="grid grid-cols-2 gap-2">
                              {availableTiles.map((tile) => (
                                <div key={tile.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`edit-${tile.id}-${admin.id}`}
                                    checked={editingTiles.includes(tile.id)}
                                    onCheckedChange={() => toggleEditingTile(tile.id)}
                                  />
                                  <label
                                    htmlFor={`edit-${tile.id}-${admin.id}`}
                                    className="text-sm leading-none cursor-pointer"
                                  >
                                    {tile.label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => saveSubAdminPermissions(admin.id)}
                            >
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={cancelEditingSubAdmin}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{admin.email}</p>
                            {admin.role && (
                              <p className="text-sm text-muted-foreground font-semibold">Role: {admin.role}</p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              Permissions: {admin.allowed_tiles.join(', ')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditingSubAdmin(admin)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteSubAdmin(admin.id, admin.email || '')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sub-Admin Password Created</AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p>Password created successfully for <strong>{generatedEmail}</strong></p>
                <div className="bg-muted p-4 rounded-md space-y-3">
                  <p className="text-sm text-muted-foreground">Password:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-background p-2 rounded text-sm font-mono break-all">
                      {generatedPassword}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyToClipboard}
                      title="Copy to clipboard"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-destructive">
                  ⚠️ Make sure to copy this password now. You won't be able to see it again!
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setShowPasswordDialog(false)}>
                Done
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default RegularAdminManageSubAdmins;
