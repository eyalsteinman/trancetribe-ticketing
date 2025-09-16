import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useBackground } from '@/contexts/BackgroundContext';
import { User } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';
import { Camera, List, Plus, Edit, Users, User as UserIcon, UserCheck, Gamepad2, Building2, Settings2, ScanBarcode, Wine, Cog, ArrowLeft, LogOut, MessageCircle } from 'lucide-react';
import Footer from '@/components/ui/footer';
import PageHeader from '@/components/ui/page-header';
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
import ReorderableTilesLogic from './ReorderableTilesLogic';
import AdminProductions from './AdminProductions';
import ManageProductions from './ManageProductions';
import AdminGuestList from './AdminGuestList';
import BarTabManager from './BarTabManager';
import BarTabScanner from './BarTabScanner';
import FAQContact from './FAQContact';
import AdminMessageSender from './AdminMessageSender';
import { useTheme } from '@/hooks/useDarkMode';

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
  const [currentView, setCurrentView] = useState<'dashboard' | 'scanner' | 'guests' | 'create-party' | 'edit-parties' | 'manage-admins' | 'registered-users' | 'admin-games' | 'color-changer' | 'dot-circle' | 'exploder' | 'haya-ninja' | 'nickname' | 'my-productions' | 'manage-productions' | 'guest-list' | 'bar-tab' | 'bar-tab-scanner' | 'faq' | 'message'>('dashboard');
  const [adminNickname, setAdminNickname] = useState('');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [newRegisteredUsers, setNewRegisteredUsers] = useState(0);
  const [newArrivingGuests, setNewArrivingGuests] = useState(0);
  
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();
  const { currentTheme, cycleTheme, getThemeDisplayName } = useTheme();

  useEffect(() => {
    loadParties();
    loadAdminProfile();
    loadNotificationCounts();
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

  const loadNotificationCounts = async () => {
    try {
      // Get last opened timestamps for dashboard tiles
      const { data: tileStates } = await supabase
        .from('admin_tile_state')
        .select('tile, last_opened_at')
        .eq('admin_id', user.id)
        .in('tile', ['registered-users', 'guest-list']);

      const registeredUsersLastOpened = tileStates?.find(t => t.tile === 'registered-users')?.last_opened_at;
      const guestListLastOpened = tileStates?.find(t => t.tile === 'guest-list')?.last_opened_at;

      // Count new registered users
      if (registeredUsersLastOpened) {
        const { count: newUsersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gt('created_at', registeredUsersLastOpened);
        setNewRegisteredUsers(newUsersCount || 0);
      } else {
        // If never opened, count all users created in last 7 days
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { count: newUsersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gt('created_at', weekAgo);
        setNewRegisteredUsers(newUsersCount || 0);
      }

      // Count new arriving guests
      if (guestListLastOpened) {
        const { count: newGuestsCount } = await supabase
          .from('qr_codes')
          .select('*', { count: 'exact', head: true })
          .eq('is_scanned', false)
          .gt('created_at', guestListLastOpened);
        setNewArrivingGuests(newGuestsCount || 0);
      } else {
        // If never opened, count all arriving guests created in last 7 days
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { count: newGuestsCount } = await supabase
          .from('qr_codes')
          .select('*', { count: 'exact', head: true })
          .eq('is_scanned', false)
          .gt('created_at', weekAgo);
        setNewArrivingGuests(newGuestsCount || 0);
      }
    } catch (error) {
      console.error('Error loading notification counts:', error);
    }
  };

  const markTileAsOpened = async (tileId: string) => {
    try {
      await supabase
        .from('admin_tile_state')
        .upsert({
          admin_id: user.id,
          tile: tileId,
          last_opened_at: new Date().toISOString()
        }, {
          onConflict: 'admin_id,tile'
        });
      
      // Reset notification count for this tile
      if (tileId === 'registered-users') {
        setNewRegisteredUsers(0);
      } else if (tileId === 'guest-list') {
        setNewArrivingGuests(0);
      }
    } catch (error) {
      console.error('Error marking tile as opened:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      
      if (error && !error.message.includes('Session not found')) {
        console.error('Sign out error:', error);
        toast({
          title: "Warning",
          description: "Logged out locally, but server logout failed.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Signed out successfully!",
        });
      }
    } catch (error) {
      console.error('Sign out catch error:', error);
      toast({
        title: "Info", 
        description: "Logged out locally.",
      });
    }
    setTimeout(() => {
      window.location.reload();
    }, 2000);
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

  if (currentView === 'faq') {
    return <FAQContact user={user} onBack={() => setCurrentView('dashboard')} isAdmin={true} />;
  }

  if (currentView === 'message') {
    return (
      <AdminMessageSender 
        onBack={() => setCurrentView('dashboard')} 
        adminId={user.id}
        adminName={user?.user_metadata?.display_name || user?.user_metadata?.full_name}
      />
    );
  }

  if (currentView === 'scanner') {
    return (
      <div 
        className="min-h-screen transition-colors duration-500"
        style={{ 
          backgroundColor
        }}
      >
        <PageHeader
          title="QR Scanner"
          onBack={() => setCurrentView('dashboard')}
        />
        
        <div className="w-full pt-20">
          {parties.length > 0 && (
            <div className="container-section">
              <div className="bg-card border border-border">
                <div className="p-4 border-b border-border">
                  <h3 className="text-lg font-bold">Select Party to Scan For</h3>
                </div>
                <div className="p-4">
                  <select 
                    className="w-full p-2 border border-border bg-background text-foreground"
                    value={selectedParty || ''}
                    onChange={(e) => setSelectedParty(e.target.value)}
                  >
                    {parties.map((party) => (
                      <option key={party.id} value={party.id}>
                        {party.name} - {new Date(party.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {selectedParty && (
            <div className="container-section">
              <QRScanner 
                onScan={(result) => scanQRCode(result)}
                onClose={() => setCurrentView('dashboard')}
              />
            </div>
          )}

          {!selectedParty && (
            <div className="container-section">
              <div className="bg-card border border-border p-6 text-center">
                <p className="text-muted-foreground">Please select a party to start scanning</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'guests') {
    return (
      <div 
        className="min-h-screen transition-colors duration-500"
        style={{ 
          backgroundColor
        }}
      >
        <PageHeader
          title="Guest Management"
          onBack={() => setCurrentView('dashboard')}
        />
        
        <div className="w-full pt-20">
          {parties.length > 0 && (
            <div className="container-section">
              <div className="bg-card border border-border">
                <div className="p-4 border-b border-border">
                  <h3 className="text-lg font-bold">Select Party</h3>
                </div>
                <div className="p-4">
                  <select 
                    className="w-full p-2 border border-border bg-background text-foreground"
                    value={selectedParty || ''}
                    onChange={(e) => setSelectedParty(e.target.value)}
                  >
                    {parties.map((party) => (
                      <option key={party.id} value={party.id}>
                        {party.name} - {new Date(party.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {selectedParty && scannedUsers.length > 0 && (
            <div className="container-section">
              <div className="bg-card border border-border">
                <div className="p-4 border-b border-border">
                  <h3 className="text-lg font-bold">Scanned Guests ({scannedUsers.length})</h3>
                </div>
                <div className="p-4">
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {scannedUsers.map((scannedUser, index) => (
                      <div key={scannedUser.id} className="flex items-center justify-between p-3 bg-muted">
                        <div>
                          <div className="font-medium">
                            {scannedUser.profiles?.display_name || 
                             `${scannedUser.profiles?.first_name || ''} ${scannedUser.profiles?.last_name || ''}`.trim() ||
                             scannedUser.profiles?.email ||
                             'Unknown User'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Scanned: {new Date(scannedUser.scanned_at).toLocaleString('en-GB')}
                          </div>
                        </div>
                        <Badge variant="outline">#{index + 1}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedParty && scannedUsers.length === 0 && (
            <div className="container-section">
              <div className="bg-card border border-border p-6 text-center">
                <p className="text-muted-foreground">No guests scanned yet for this party</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 p-2 sm:p-4`}>
      <div className="w-full">
        <div className="container-section flex items-center justify-between mb-4 lg:mb-6">
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              {adminNickname ? `Welcome back,` : 'Admin Dashboard'}
            </h1>
            {adminNickname && (
              <p className="text-lg sm:text-xl lg:text-2xl text-primary font-bold">{adminNickname}!</p>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleSignOut} 
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 hover:bg-card hover:border-primary/50 transition-all duration-300 hover:scale-105"
            aria-label="Sign Out"
          >
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
        
        {adminNickname && (
          <div className="container-section">
            <p 
              className="text-sm"
              style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}
            >
              Welcome back {adminNickname}
            </p>
          </div>
        )}

        {(() => {
          const tiles = [
            { id: 'scanner', title: 'Camera Scan', icon: <Camera className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />, onClick: () => { setCurrentView('scanner' as const); setTimeout(() => loadParties(), 100); } },
            { 
              id: 'guests', 
              title: 'Guest List', 
              icon: <List className="h-8 w-8 mb-2" />, 
              onClick: () => { 
                markTileAsOpened('guest-list'); 
                setCurrentView('guest-list' as const); 
                setTimeout(() => loadParties(), 100); 
              },
              notificationCount: newArrivingGuests
            },
            { id: 'create-party', title: 'Create Party', icon: <Plus className="h-8 w-8 mb-2" />, onClick: () => { setCurrentView('create-party' as const); setTimeout(() => loadParties(), 100); } },
            { id: 'edit-parties', title: 'Edit Parties', icon: <Edit className="h-8 w-8 mb-2" />, onClick: () => { setCurrentView('edit-parties' as const); setTimeout(() => loadParties(), 100); } },
            { id: 'my-productions', title: 'My Productions', icon: <Building2 className="h-8 w-8 mb-2" />, onClick: () => { setCurrentView('my-productions' as const); setTimeout(() => loadParties(), 100); } },
            { id: 'manage-productions', title: 'Manage Productions', icon: <Settings2 className="h-8 w-8 mb-2" />, onClick: () => { setCurrentView('manage-productions' as const); setTimeout(() => loadParties(), 100); } },
            { id: 'manage-admins', title: 'Add Admin', icon: <Users className="h-8 w-8 mb-2" />, onClick: () => { setCurrentView('manage-admins' as const); setTimeout(() => loadParties(), 100); } },
            { 
              id: 'registered-users', 
              title: 'Registered Users', 
              icon: <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />, 
              onClick: () => { 
                markTileAsOpened('registered-users');
                setCurrentView('registered-users' as const); 
                setTimeout(() => loadParties(), 100); 
              },
              notificationCount: newRegisteredUsers
            },
            { id: 'admin-games', title: 'Admin Games', icon: <Gamepad2 className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />, onClick: () => { setCurrentView('admin-games' as const); setTimeout(() => loadParties(), 100); } },
            { id: 'nickname', title: 'My Info', icon: <UserIcon className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />, onClick: () => { setCurrentView('nickname' as const); setTimeout(() => loadParties(), 100); } },
            { id: 'bar-tab', title: 'Bar Tab', icon: <Wine className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />, onClick: () => { setCurrentView('bar-tab' as const); setTimeout(() => loadParties(), 100); } },
            { id: 'bar-tab-scanner', title: 'Bartab Scanner', icon: <ScanBarcode className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />, onClick: () => { setCurrentView('bar-tab-scanner' as const); setTimeout(() => loadParties(), 100); } },
            { id: 'faq', title: 'FAQ & Contact', icon: <Users className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />, onClick: () => { setCurrentView('faq' as const); setTimeout(() => loadParties(), 100); } },
            { id: 'theme-changer', title: `Change Theme\n(${getThemeDisplayName(currentTheme)})`, icon: <Settings2 className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />, onClick: cycleTheme },
            { id: 'message', title: 'Message Users', icon: <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />, onClick: () => { setCurrentView('message' as const); setTimeout(() => loadParties(), 100); } },
          ];
          return (
            <ReorderableTilesLogic 
              items={tiles} 
              orderKey={`dashboard-order-admin-${user.id}`}
              onLongPress={(id) => {
                // Handle long press for reordering
                console.log('Long press on:', id);
              }} 
            />
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
            <div className="container-section">
              <div className="border border-border bg-card">
                <div className="p-4 border-b border-border">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold">Upcoming Parties</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortAscending(!sortAscending)}
                      className="text-xs"
                    >
                      {sortAscending ? "Latest First" : "Soonest First"}
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {upcomingParties.map((party, index) => (
                      <div
                        key={party.id}
                        className="border border-border p-3 cursor-pointer hover:bg-accent transition-colors"
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
                              className="w-16 h-16 object-cover"
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
                </div>
              </div>
            </div>
          );
        })()}
        
        <Footer />
      </div>
    </div>
  );
};

export default AdminDashboard;