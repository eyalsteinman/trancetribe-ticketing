import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useBackground } from '@/contexts/BackgroundContext';
import { User } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';
import { Camera, List, Plus, Edit, Users, User as UserIcon, UserCheck, Gamepad2, Building2, Settings2, ArrowLeft, ScanBarcode, Wine, Cog } from 'lucide-react';
import CreateParty from './CreateParty';
import EditParties from './EditParties';
import QRScanner from './QRScanner';
import ManageAdmins from './ManageAdmins';
import RegisteredUsers from './RegisteredUsers';
import BoredScreen from './BoredScreen';
import AdminGames from './AdminGames';
import DotCircleGame from './DotCircleGame';
import ExploderGame from './ExploderGame';
import PersonalizeEdit from './PersonalizeEdit';
import HayaNinja from './HayaNinja';
import ReorderableTiles from './ReorderableTiles';
import AdminProductions from './AdminProductions';
import ManageProductions from './ManageProductions';
import AdminGuestList from './AdminGuestList';
import BarTabManager from './BarTabManager';
import BarTabScanner from './BarTabScanner';
import { useDarkMode } from '@/hooks/useDarkMode';

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
  const [currentView, setCurrentView] = useState<'dashboard' | 'scanner' | 'guests' | 'create-party' | 'edit-parties' | 'manage-admins' | 'registered-users' | 'admin-games' | 'color-changer' | 'dot-circle' | 'exploder' | 'haya-ninja' | 'nickname' | 'my-productions' | 'manage-productions' | 'guest-list' | 'bar-tab' | 'bar-tab-scanner'>('dashboard');
  const [adminNickname, setAdminNickname] = useState('');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

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
        .select(`
          *,
          qr_codes!inner(is_approved)
        `)
        .order('date', { ascending: sortAscending });

      if (error) {
        console.error('Error loading parties:', error);
      } else {
        // Add approved guest count to each party
        const partiesWithCounts = (data || []).map((party: any) => ({
          ...party,
          approved_count: party.qr_codes?.filter((qr: any) => qr.is_approved).length || 0
        }));
        setParties(partiesWithCounts);
        // Set the first party as selected by default
        if (partiesWithCounts && partiesWithCounts.length > 0 && !selectedParty) {
          setSelectedParty(partiesWithCounts[0].id);
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
    return <PersonalizeEdit user={user} onBack={() => setCurrentView('dashboard')} />;
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

  if (currentView === 'my-productions') {
    return <AdminProductions 
      onBack={() => setCurrentView('dashboard')} 
      onEdit={(productionId: string) => {
        setCurrentView('manage-productions');
        setTimeout(() => {
          const editButton = document.querySelector(`[data-production-id="${productionId}"] button[aria-label*="Edit"]`) as HTMLButtonElement;
          if (editButton) editButton.click();
        }, 100);
      }}
    />;
  }

  if (currentView === 'manage-productions') {
    return <ManageProductions onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'guest-list') {
    return <AdminGuestList user={user} onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'bar-tab') {
    return <BarTabManager user={user} onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'bar-tab-scanner') {
    return <BarTabScanner user={user} onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'scanner') {
    return (
      <div 
        className="min-h-screen p-4 transition-colors duration-500"
        style={{ 
          backgroundColor
        }}
      >
        <div className="max-w-md mx-auto space-y-6 text-left">
          <div className="relative">
            <h1 className="text-2xl font-bold">QR Scanner</h1>
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
        <div className="max-w-md mx-auto space-y-6 text-left">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Scanned Guests</h1>
            <Button variant="outline" className="on-color back-button absolute top-4 right-4" size="icon" onClick={() => setCurrentView('dashboard')} aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
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
      <div className="max-w-md mx-auto space-y-6 text-left">
        <div className="flex items-center justify-between">
          <h1 
            className="text-xl font-bold"
            style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}
          >
            Admin Dashboard
          </h1>
          <Button variant="outline" onClick={handleSignOut} className="on-color">
            Sign Out
          </Button>
        </div>
        
        <div className="space-y-4">
          {adminNickname && (
            <p 
              className="text-sm"
              style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}
            >
              Welcome back {adminNickname}
            </p>
          )}

          {(() => {
            const tiles = [
              { id: 'scanner', title: 'Camera Scan', icon: <Camera className="h-8 w-8 mb-2" />, onClick: () => { setCurrentView('scanner' as const); setTimeout(() => loadParties(), 100); } },
              { id: 'guests', title: 'Guest List', icon: <List className="h-8 w-8 mb-2" />, onClick: () => { setCurrentView('guest-list' as const); setTimeout(() => loadParties(), 100); } },
              { id: 'create-party', title: 'Create Party', icon: <Plus className="h-8 w-8 mb-2" />, onClick: () => { setCurrentView('create-party' as const); setTimeout(() => loadParties(), 100); } },
              { id: 'edit-parties', title: 'Edit Parties', icon: <Edit className="h-8 w-8 mb-2" />, onClick: () => { setCurrentView('edit-parties' as const); setTimeout(() => loadParties(), 100); } },
              { id: 'my-productions', title: 'My Productions', icon: <Building2 className="h-8 w-8 mb-2" />, onClick: () => { setCurrentView('my-productions' as const); setTimeout(() => loadParties(), 100); } },
              { id: 'manage-productions', title: 'Manage Productions', icon: <Settings2 className="h-8 w-8 mb-2" />, onClick: () => { setCurrentView('manage-productions' as const); setTimeout(() => loadParties(), 100); } },
              { id: 'manage-admins', title: 'Add Admin', icon: <Users className="h-8 w-8 mb-2" />, onClick: () => { setCurrentView('manage-admins' as const); setTimeout(() => loadParties(), 100); } },
              { id: 'registered-users', title: 'Registered Users', icon: <UserCheck className="h-8 w-8 mb-2" />, onClick: () => { setCurrentView('registered-users' as const); setTimeout(() => loadParties(), 100); } },
              { id: 'admin-games', title: 'Admin Games', icon: <Gamepad2 className="h-8 w-8 mb-2" />, onClick: () => { setCurrentView('admin-games' as const); setTimeout(() => loadParties(), 100); } },
              { id: 'nickname', title: 'Choose Nickname', icon: <UserIcon className="h-8 w-8 mb-2" />, onClick: () => { setCurrentView('nickname' as const); setTimeout(() => loadParties(), 100); } },
              { id: 'bar-tab', title: 'Bar Tab', icon: <Wine className="h-8 w-8 mb-2" />, onClick: () => { setCurrentView('bar-tab' as const); setTimeout(() => loadParties(), 100); } },
              { id: 'bar-tab-scanner', title: 'Bartab Scanner', icon: <ScanBarcode className="h-8 w-8 mb-2" />, onClick: () => { setCurrentView('bar-tab-scanner' as const); setTimeout(() => loadParties(), 100); } },
              { id: 'dark-mode', title: isDarkMode ? 'Light Mode' : 'Dark Mode', icon: <Cog className="h-8 w-8 mb-2" />, onClick: toggleDarkMode },
            ];
            return (
              <ReorderableTiles items={tiles} orderKey={`dashboard-order-admin-${user.id}`} />
            );
          })()}

          {(() => {
            // Find upcoming parties
            const now = new Date();
            const upcomingParties = parties
              .filter(p => new Date(p.date) >= now)
              .sort((a, b) => sortAscending ? 
                new Date(a.date).getTime() - new Date(b.date).getTime() :
                new Date(b.date).getTime() - new Date(a.date).getTime()
              );
            
            return upcomingParties.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      Upcoming Parties
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSortAscending(!sortAscending)}
                        className="text-xs"
                      >
                        {sortAscending ? "Latest First" : "Soonest First"}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {upcomingParties.map((party, index) => (
                        <div
                          key={party.id}
                          className="border rounded-lg p-3 cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => {
                            setCurrentView('edit-parties');
                            // Pass the party ID to edit parties component
                            setTimeout(() => {
                              const editButton = document.querySelector(`[data-party-id="${party.id}"] button[aria-label*="Edit"]`) as HTMLButtonElement;
                              if (editButton) editButton.click();
                            }, 100);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {party.photo_url && (
                              <img 
                                src={party.photo_url} 
                                alt={party.name}
                                className="w-16 h-16 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <div className="font-semibold">{party.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(party.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                {(party.start_time || party.end_time) && (
                                  <span className="block text-xs mt-1">
                                    {party.start_time && `Start: ${party.start_time}`}
                                    {party.start_time && party.end_time && ' | '}
                                    {party.end_time && `End: ${party.end_time}`}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-blue-600 font-medium mt-1">
                                Guests arriving: {party.approved_count || 0}
                              </div>
                              {index === 0 && sortAscending && (
                                <div className="text-xs text-green-600 font-medium">Soonest</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
            );
          })()}
        </div>
        
        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-center space-y-2">
          <h3 className="font-bold text-lg">Trance Tribes Tickets</h3>
          <p className="text-xs text-muted-foreground">
            Created by Eyal Steinman, all rights reserved 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;