import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useBackground } from '@/contexts/BackgroundContext';
import { User } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';
import { Camera, List, Plus, Edit, Users, User as UserIcon, UserCheck, Gamepad2 } from 'lucide-react';
import CreateParty from './CreateParty';
import EditParties from './EditParties';
import QRScanner from './QRScanner';
import ManageAdmins from './ManageAdmins';
import RegisteredUsers from './RegisteredUsers';
import BoredScreen from './BoredScreen';
import AdminGames from './AdminGames';
import DotCircleGame from './DotCircleGame';
import ExploderGame from './ExploderGame';
import NicknameManager from './NicknameManager';
import HayaNinja from './HayaNinja';
import ReorderableTiles from './ReorderableTiles';

interface AdminDashboardProps {
  user: User;
}

interface ScannedUser {
  id: string;
  user_id: string;
  scanned_at: string;
  profiles: {
    display_name: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

const AdminDashboard = ({ user }: AdminDashboardProps) => {
  const [qrInput, setQrInput] = useState('');
  const [scannedUsers, setScannedUsers] = useState<ScannedUser[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortAscending, setSortAscending] = useState(true); // Default to soonest first
  const [currentView, setCurrentView] = useState<'dashboard' | 'scanner' | 'guests' | 'create-party' | 'edit-parties' | 'manage-admins' | 'registered-users' | 'admin-games' | 'color-changer' | 'dot-circle' | 'exploder' | 'haya-ninja' | 'nickname'>('dashboard');
  const [adminNickname, setAdminNickname] = useState('');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();

  useEffect(() => {
    loadParties();
    loadAdminProfile();
  }, []);

  useEffect(() => {
    loadParties();
  }, [sortAscending]);

  useEffect(() => {
    if (selectedParty) {
      loadScannedUsers();
    }
  }, [selectedParty]);

  const loadParties = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('parties')
        .select('*')
        .order('date', { ascending: sortAscending });

      if (error) {
        console.error('Error loading parties:', error);
      } else {
        setParties(data || []);
        // Set the first party as selected by default
        if (data && data.length > 0 && !selectedParty) {
          setSelectedParty(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading parties:', error);
    }
  };

  const loadScannedUsers = async () => {
    if (!selectedParty) return;
    
    try {
      // First get QR codes for scanned users
      const { data: qrData, error: qrError } = await supabase
        .from('qr_codes')
        .select('id, user_id, scanned_at, party_id')
        .eq('is_scanned', true)
        .eq('scanned_by', user.id)
        .eq('party_id', selectedParty)
        .order('scanned_at', { ascending: true });

      if (qrError) {
        console.error('Error loading QR codes:', qrError);
        return;
      }

      if (!qrData || qrData.length === 0) {
        setScannedUsers([]);
        return;
      }

      // Get user IDs
      const userIds = qrData.map(qr => qr.user_id);

      // Get profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, first_name, last_name, email')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        return;
      }

      // Combine the data
      const combinedData = qrData.map(qr => {
        const profile = profilesData?.find(p => p.user_id === qr.user_id);
        return {
          ...qr,
          profiles: profile || null
        };
      });

      setScannedUsers(combinedData);
    } catch (error) {
      console.error('Error loading scanned users:', error);
    }
  };

  const scanQRCode = async (qrCode?: string) => {
    const codeToScan = qrCode || qrInput.trim();
    
    if (!codeToScan) {
      toast({
        title: "Error",
        description: "Please enter a QR code",
        variant: "destructive"
      });
      return;
    }

    if (!selectedParty) {
      toast({
        title: "Error",
        description: "Please select a party first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // First check if QR code exists and is not already scanned
      const { data: qrData, error: qrError } = await (supabase as any)
        .from('qr_codes')
        .select('id, user_id, is_scanned, party_id')
        .eq('code', codeToScan)
        .eq('party_id', selectedParty)
        .single();

      if (qrError || !qrData) {
        toast({
          title: "Error",
          description: "Invalid QR code",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      if (qrData.is_scanned) {
        toast({
          title: "Error",
          description: "This QR code has already been scanned",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Mark QR code as scanned
      const { error: updateError } = await (supabase as any)
        .from('qr_codes')
        .update({
          is_scanned: true,
          scanned_at: new Date().toISOString(),
          scanned_by: user.id
        })
        .eq('id', qrData.id);

      if (updateError) {
        toast({
          title: "Error",
          description: updateError.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "QR code scanned successfully!",
        });
        setQrInput('');
        setCurrentView('dashboard');
        loadScannedUsers(); // Refresh the list
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to scan QR code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAdminProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading admin profile:', error);
        return;
      }

      if (data?.nickname) {
        setAdminNickname(data.nickname);
      }
    } catch (error) {
      console.error('Error loading admin profile:', error);
    }
  };

  const saveNickname = async () => {
    if (!nicknameInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a nickname",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ nickname: nicknameInput.trim() })
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to save nickname",
          variant: "destructive"
        });
        return;
      }

      setAdminNickname(nicknameInput.trim());
      setIsEditingNickname(false);
      setNicknameInput('');
      
      toast({
        title: "Success",
        description: "Nickname saved successfully!",
      });

      // Refresh the page
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save nickname",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to sign out",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to sign out",
        variant: "destructive"
      });
    }
  };

  if (currentView === 'nickname') {
    return <NicknameManager user={user} onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'create-party') {
    return <CreateParty onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'edit-parties') {
    return <EditParties onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'manage-admins') {
    return <ManageAdmins onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'registered-users') {
    return <RegisteredUsers onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'admin-games') {
    return <AdminGames onBack={() => setCurrentView('dashboard')} onGameSelect={(game) => setCurrentView(game as any)} />;
  }

  if (currentView === 'color-changer') {
    return <BoredScreen onBack={() => setCurrentView('admin-games')} />;
  }

  if (currentView === 'dot-circle') {
    return <DotCircleGame onBack={() => setCurrentView('admin-games')} adminId={user.id} adminNickname={adminNickname} />;
  }

  if (currentView === 'exploder') {
    return <ExploderGame onBack={() => setCurrentView('admin-games')} scope="admin" playerNickname={adminNickname} />;
  }

  if (currentView === 'haya-ninja') {
    return <HayaNinja onBack={() => setCurrentView('admin-games')} scope="admin" playerNickname={adminNickname} />;
  }

  if (currentView === 'scanner') {
    return (
      <div 
        className="min-h-screen p-4 transition-colors duration-500"
        style={{ 
          backgroundColor
        }}
      >
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">QR Scanner</h1>
            <Button variant="outline" onClick={() => setCurrentView('dashboard')}>
              Back
            </Button>
          </div>
          
          {parties.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Select Party to Scan For</CardTitle>
              </CardHeader>
              <CardContent>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={selectedParty || ''}
                  onChange={(e) => setSelectedParty(e.target.value)}
                >
                  {parties.map((party) => (
                    <option key={party.id} value={party.id}>
                      {party.name} - {new Date(party.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>
          )}

          {selectedParty && (
            <QRScanner 
              onScan={(result) => scanQRCode(result)}
              onClose={() => setCurrentView('dashboard')}
            />
          )}

          {!selectedParty && (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Please select a party to start scanning</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'guests') {
    return (
      <div 
        className="min-h-screen p-4 transition-colors duration-500"
        style={{ 
          backgroundColor
        }}
      >
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Scanned Guests</h1>
            <Button variant="outline" onClick={() => setCurrentView('dashboard')}>
              Back
            </Button>
          </div>
          {parties.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Select Party</CardTitle>
              </CardHeader>
              <CardContent>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={selectedParty || ''}
                  onChange={(e) => setSelectedParty(e.target.value)}
                >
                  {parties.map((party) => (
                    <option key={party.id} value={party.id}>
                      {party.name} - {new Date(party.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Guest List</CardTitle>
              <Badge variant="secondary">{scannedUsers.length} guests scanned for selected party</Badge>
            </CardHeader>
            <CardContent>
              {scannedUsers.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No guests scanned yet
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">#</th>
                        <th className="text-left p-2 font-medium">First Name</th>
                        <th className="text-left p-2 font-medium">Last Name</th>
                        <th className="text-left p-2 font-medium">Email</th>
                        <th className="text-left p-2 font-medium">Scanned At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scannedUsers.map((user, index) => (
                        <tr key={user.id} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-medium">{index + 1}</td>
                          <td className="p-2">
                            {user.profiles?.first_name || 'Unknown'}
                          </td>
                          <td className="p-2">
                            {user.profiles?.last_name || 'Unknown'}
                          </td>
                          <td className="p-2 text-sm">
                            {user.profiles?.email || 'No email'}
                          </td>
                          <td className="p-2 text-sm text-muted-foreground">
                            {new Date(user.scanned_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-4 transition-colors duration-500"
      style={{ 
        backgroundColor
      }}
    >
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 
              className="text-2xl font-bold"
              style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}
            >
              Admin Dashboard
            </h1>
            {adminNickname && (
              <p 
                className="text-sm mt-1"
                style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}
              >
                Welcome back {adminNickname}
              </p>
            )}
          </div>
          <Button variant="outline" onClick={handleSignOut} className="whitespace-nowrap">
            Sign Out
          </Button>
        </div>

        {(() => {
          const tiles = [
            { id: 'scanner', title: 'Camera Scan', icon: <Camera className="h-8 w-8 mb-2" />, onClick: () => setCurrentView('scanner' as const) },
            { id: 'guests', title: 'Guest List', icon: <List className="h-8 w-8 mb-2" />, onClick: () => setCurrentView('guests' as const) },
            { id: 'create-party', title: 'Create Party', icon: <Plus className="h-8 w-8 mb-2" />, onClick: () => setCurrentView('create-party' as const) },
            { id: 'edit-parties', title: 'Edit Parties', icon: <Edit className="h-8 w-8 mb-2" />, onClick: () => setCurrentView('edit-parties' as const) },
            { id: 'manage-admins', title: 'Add Admin', icon: <Users className="h-8 w-8 mb-2" />, onClick: () => setCurrentView('manage-admins' as const) },
            { id: 'registered-users', title: 'Registered Users', icon: <UserCheck className="h-8 w-8 mb-2" />, onClick: () => setCurrentView('registered-users' as const) },
            { id: 'admin-games', title: 'Admin Games', icon: <Gamepad2 className="h-8 w-8 mb-2" />, onClick: () => setCurrentView('admin-games' as const) },
            { id: 'nickname', title: 'Choose Nickname', icon: <UserIcon className="h-8 w-8 mb-2" />, onClick: () => setCurrentView('nickname' as const) },
          ];
          return (
            <ReorderableTiles items={tiles} orderKey={`dashboard-order-admin-${user.id}`} />
          );
        })()}



        {selectedParty && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Coming Up</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortAscending(!sortAscending)}
                  className="flex items-center gap-2"
                >
                  {sortAscending ? "Latest First" : "Soonest First"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="text-lg font-semibold">
                  {parties.find(p => p.id === selectedParty)?.name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {parties.find(p => p.id === selectedParty)?.date && 
                    new Date(parties.find(p => p.id === selectedParty)?.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                {parties.find(p => p.id === selectedParty)?.photo_url && (
                  <div className="w-full">
                    <img 
                      src={parties.find(p => p.id === selectedParty)?.photo_url} 
                      alt={parties.find(p => p.id === selectedParty)?.name}
                      className="w-full h-auto object-contain rounded-md mx-auto"
                    />
                  </div>
                )}
                <div className="text-2xl font-bold">{scannedUsers.length}</div>
                <div className="text-sm text-muted-foreground">Guests Scanned</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
    </div>
  );
};

export default AdminDashboard;