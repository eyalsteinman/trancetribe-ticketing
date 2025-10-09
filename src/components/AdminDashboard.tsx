import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useBackground } from '@/contexts/BackgroundContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { User } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';
import { Camera, List, Plus, Edit, Users, User as UserIcon, UserCheck, Gamepad2, Building2, Settings2, ScanBarcode, Wine, Cog, ArrowLeft, LogOut, MessageCircle, Calendar, Clock, UserPlus } from 'lucide-react';
import Footer from '@/components/ui/footer';
import PageHeader from '@/components/ui/page-header';
import LanguageSelector from './LanguageSelector';
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
import ViewTransition from './ui/view-transition';
import ScrollToTop from './ui/scroll-to-top';
import { useScrollMemory } from '@/hooks/useScrollMemory';

interface AdminDashboardProps {
  user: User;
  onManageSubAdmins?: () => void;
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

const AdminDashboard = ({ user, onManageSubAdmins }: AdminDashboardProps) => {
  const [qrInput, setQrInput] = useState('');
  const [scannedUsers, setScannedUsers] = useState<ScannedUser[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortAscending, setSortAscending] = useState(true); // Default to soonest first
  const [currentView, setCurrentView] = useState<'dashboard' | 'scanner' | 'guests' | 'create-party' | 'edit-parties' | 'registered-users' | 'admin-games' | 'color-changer' | 'dot-circle' | 'exploder' | 'haya-ninja' | 'nickname' | 'my-productions' | 'manage-productions' | 'guest-list' | 'bar-tab' | 'bar-tab-scanner' | 'faq' | 'message'>('dashboard');
  const [adminNickname, setAdminNickname] = useState('');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [newRegisteredUsers, setNewRegisteredUsers] = useState(0);
  const [newArrivingGuests, setNewArrivingGuests] = useState(0);
  const [totalRegisteredUsers, setTotalRegisteredUsers] = useState(0);
  const [totalArrivingGuests, setTotalArrivingGuests] = useState(0);
  
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();
  const { currentTheme, cycleTheme, getThemeDisplayName } = useTheme();
  const { t } = useLanguage();

  // Add scroll memory
  useScrollMemory({ viewKey: currentView, enabled: true });

  useEffect(() => {
    loadParties();
    loadAdminProfile();
    loadNotificationCounts();

    // Set up real-time updates for counts
    const channel = supabase
      .channel('admin-counts-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'production_followers'
        },
        () => {
          console.log('Production followers changed, reloading counts');
          loadNotificationCounts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'qr_codes'
        },
        () => {
          console.log('QR codes changed, reloading counts');
          loadNotificationCounts();
        }
      )
      .subscribe();

    // Set up real-time subscription for party updates and QR code changes
    const partyChannel = supabase
      .channel('party-dashboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parties'
        },
        () => {
          loadParties();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'qr_codes'
        },
        () => {
          loadParties();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(partyChannel);
    };
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
          qr_codes(is_approved),
          productions(name)
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
      console.log('Loading notification counts for admin:', user.id);
      
      // Check if user is super admin
      const { data: adminProfile } = await supabase
        .from('admin_profiles')
        .select('is_super_admin')
        .eq('user_id', user.id)
        .single();

      const isSuperAdmin = adminProfile?.is_super_admin || false;
      console.log('Is super admin:', isSuperAdmin);

      // Get last opened timestamps for dashboard tiles
      const { data: tileStates } = await supabase
        .from('admin_tile_state')
        .select('tile, last_opened_at')
        .eq('admin_id', user.id)
        .in('tile', ['registered-users', 'guest-list']);

      const registeredUsersLastOpened = tileStates?.find(t => t.tile === 'registered-users')?.last_opened_at;
      const guestListLastOpened = tileStates?.find(t => t.tile === 'guest-list')?.last_opened_at;

      // Count registered users
      if (isSuperAdmin) {
        // Super admin sees ALL users in the system
        const { count: totalUsersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        console.log('Super admin - Total users in system:', totalUsersCount);
        setTotalRegisteredUsers(totalUsersCount || 0);

        // Count NEW users for badge
        if (registeredUsersLastOpened) {
          const { count: newUsersCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gt('created_at', registeredUsersLastOpened);
          setNewRegisteredUsers(newUsersCount || 0);
        } else {
          setNewRegisteredUsers(totalUsersCount || 0);
        }
      } else {
        // Regular admin sees only followers of their productions
        const { data: adminProductions } = await supabase
          .from('productions')
          .select('id')
          .eq('created_by', user.id);

        const productionIds = adminProductions?.map(p => p.id) || [];

        if (productionIds.length > 0) {
          const { data: followers } = await supabase
            .from('production_followers')
            .select('user_id')
            .in('production_id', productionIds);

          const followerUserIds = [...new Set(followers?.map(f => f.user_id) || [])];
          
          console.log('Regular admin - Followers count:', followerUserIds.length);
          setTotalRegisteredUsers(followerUserIds.length);

          // Count NEW followers for badge
          if (registeredUsersLastOpened && followerUserIds.length > 0) {
            const { count: newUsersCount } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true })
              .in('user_id', followerUserIds)
              .gt('created_at', registeredUsersLastOpened);
            setNewRegisteredUsers(newUsersCount || 0);
          } else {
            setNewRegisteredUsers(followerUserIds.length);
          }
        } else {
          setTotalRegisteredUsers(0);
          setNewRegisteredUsers(0);
        }
      }

      // Count guests
      if (isSuperAdmin) {
        // Super admin sees ALL arriving guests in the system
        const { count: totalGuestsCount } = await supabase
          .from('qr_codes')
          .select('*', { count: 'exact', head: true })
          .eq('is_scanned', false);
        
        console.log('Super admin - Total arriving guests:', totalGuestsCount);
        setTotalArrivingGuests(totalGuestsCount || 0);

        // Count NEW guests for badge
        if (guestListLastOpened) {
          const { count: newGuestsCount } = await supabase
            .from('qr_codes')
            .select('*', { count: 'exact', head: true })
            .eq('is_scanned', false)
            .gt('created_at', guestListLastOpened);
          setNewArrivingGuests(newGuestsCount || 0);
        } else {
          setNewArrivingGuests(totalGuestsCount || 0);
        }
      } else {
        // Regular admin sees only guests from their parties
        const { data: adminParties } = await supabase
          .from('parties')
          .select('id')
          .eq('created_by', user.id);

        const partyIds = adminParties?.map(p => p.id) || [];

        if (partyIds.length > 0) {
          const { count: totalGuestsCount } = await supabase
            .from('qr_codes')
            .select('*', { count: 'exact', head: true })
            .in('party_id', partyIds)
            .eq('is_scanned', false);
          
          console.log('Regular admin - Arriving guests count:', totalGuestsCount);
          setTotalArrivingGuests(totalGuestsCount || 0);

          // Count NEW guests for badge
          if (guestListLastOpened) {
            const { count: newGuestsCount } = await supabase
              .from('qr_codes')
              .select('*', { count: 'exact', head: true })
              .in('party_id', partyIds)
              .eq('is_scanned', false)
              .gt('created_at', guestListLastOpened);
            setNewArrivingGuests(newGuestsCount || 0);
          } else {
            setNewArrivingGuests(totalGuestsCount || 0);
          }
        } else {
          setTotalArrivingGuests(0);
          setNewArrivingGuests(0);
        }
      }
      
      console.log('Final counts - Total Registered:', totalRegisteredUsers, 'New Registered:', newRegisteredUsers);
      console.log('Final counts - Total Guests:', totalArrivingGuests, 'New Guests:', newArrivingGuests);
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
      // Auth state change will handle navigation automatically
    } catch (error) {
      console.error('Sign out catch error:', error);
      toast({
        title: "Info", 
        description: "Logged out locally.",
      });
    }
  };

  if (currentView === 'nickname') {
    return <div className="animate-enter"><PersonalizeEdit user={user} onBack={() => setCurrentView('dashboard')} /></div>;
  }

  if (currentView === 'create-party') {
    return <div className="animate-enter"><CreateParty onBack={() => setCurrentView('dashboard')} /></div>;
  }

  if (currentView === 'edit-parties') {
    return <div className="animate-enter"><EditParties onBack={() => setCurrentView('dashboard')} /></div>;
  }


  if (currentView === 'registered-users') {
    return <div className="animate-enter"><RegisteredUsers onBack={() => setCurrentView('dashboard')} /></div>;
  }

  if (currentView === 'admin-games') {
    return <div className="animate-enter"><AdminGames onBack={() => setCurrentView('dashboard')} onGameSelect={(game) => setCurrentView(game as any)} /></div>;
  }

  if (currentView === 'color-changer') {
    return <div className="animate-enter"><BoredScreen onBack={() => setCurrentView('admin-games')} /></div>;
  }

  if (currentView === 'dot-circle') {
    return <div className="animate-enter"><DotCircleGame onBack={() => setCurrentView('admin-games')} adminId={user.id} adminNickname={adminNickname} /></div>;
  }

  if (currentView === 'exploder') {
    return <div className="animate-enter"><ExploderGame onBack={() => setCurrentView('admin-games')} scope="admin" playerNickname={adminNickname} /></div>;
  }

  if (currentView === 'haya-ninja') {
    return <div className="animate-enter"><HayaNinja onBack={() => setCurrentView('admin-games')} scope="admin" playerNickname={adminNickname} /></div>;
  }

  if (currentView === 'my-productions') {
    return <div className="animate-enter"><AdminProductions 
      onBack={() => setCurrentView('dashboard')} 
      onEdit={(productionId: string) => {
        setCurrentView('manage-productions');
        setTimeout(() => {
          const editButton = document.querySelector(`[data-production-id="${productionId}"] button[aria-label*="Edit"]`) as HTMLButtonElement;
          if (editButton) editButton.click();
        }, 100);
      }}
    /></div>;
  }

  if (currentView === 'manage-productions') {
    return <div className="animate-enter"><ManageProductions onBack={() => setCurrentView('dashboard')} /></div>;
  }

  if (currentView === 'guest-list') {
    return <div className="animate-enter"><AdminGuestList user={user} onBack={() => setCurrentView('dashboard')} /></div>;
  }

  if (currentView === 'bar-tab') {
    return <div className="animate-enter"><BarTabManager user={user} onBack={() => setCurrentView('dashboard')} /></div>;
  }

  if (currentView === 'bar-tab-scanner') {
    return <div className="animate-enter"><BarTabScanner user={user} onBack={() => setCurrentView('dashboard')} /></div>;
  }

  if (currentView === 'faq') {
    return <div className="animate-enter"><FAQContact user={user} onBack={() => setCurrentView('dashboard')} isAdmin={true} /></div>;
  }

  if (currentView === 'message') {
    return (
      <div className="animate-enter">
        <AdminMessageSender 
          onBack={() => setCurrentView('dashboard')} 
          adminId={user.id}
          adminName={user?.user_metadata?.display_name || user?.user_metadata?.full_name}
        />
      </div>
    );
  }

  if (currentView === 'scanner') {
    return (
      <ViewTransition viewKey={currentView}>
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
      </ViewTransition>
    );
  }

  if (currentView === 'guests') {
    return (
      <ViewTransition viewKey={currentView}>
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
      </ViewTransition>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500`}>
      <div className="w-full">
        {/* Modern Hero Header with Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-background border-b border-border/20">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
          <div className="container-section relative py-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                {adminNickname && (
                  <p className="text-lg text-muted-foreground font-medium">
                    Welcome back, <span className="text-foreground font-semibold">{adminNickname}</span>
                  </p>
                )}
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleSignOut} 
                className="border-primary/30 bg-background/80 backdrop-blur-sm text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-lg hover:shadow-primary/25"
                aria-label="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {(() => {
          const tiles = [
            { id: 'scanner', title: 'Camera Scan', icon: <Camera className="h-8 w-8 mb-2" />, onClick: () => { setCurrentView('scanner' as const); setTimeout(() => loadParties(), 100); } },
            { 
              id: 'guests', 
              title: 'Guest List', 
              icon: <List className="h-8 w-8 mb-2" />, 
              onClick: () => { 
                markTileAsOpened('guest-list'); 
                setCurrentView('guest-list' as const); 
                setTimeout(() => loadParties(), 100); 
              },
              notificationCount: newArrivingGuests,
              displayCount: totalArrivingGuests
            },
            { id: 'create-party', title: 'Create Party', icon: <Plus className="h-8 w-8 mb-2" />, onClick: () => { setCurrentView('create-party' as const); setTimeout(() => loadParties(), 100); } },
            { id: 'edit-parties', title: 'Edit Parties', icon: <Edit className="h-8 w-8 mb-2" />, onClick: () => { setCurrentView('edit-parties' as const); setTimeout(() => loadParties(), 100); } },
            { id: 'my-productions', title: 'My Productions', icon: <Building2 className="h-8 w-8 mb-2" />, onClick: () => { setCurrentView('my-productions' as const); setTimeout(() => loadParties(), 100); } },
            { id: 'manage-productions', title: 'Manage Productions', icon: <Settings2 className="h-8 w-8 mb-2" />, onClick: () => { setCurrentView('manage-productions' as const); setTimeout(() => loadParties(), 100); } },
            { 
              id: 'registered-users', 
              title: 'Registered Users', 
              icon: <UserCheck className="h-8 w-8 mb-2" />, 
              onClick: () => { 
                markTileAsOpened('registered-users'); 
                setCurrentView('registered-users' as const); 
                setTimeout(() => loadParties(), 100); 
              },
              notificationCount: newRegisteredUsers,
              displayCount: totalRegisteredUsers
            },
            { id: 'admin-games', title: 'Admin Games', icon: <Gamepad2 className="h-8 w-8 mb-2" />, onClick: () => { setCurrentView('admin-games' as const); setTimeout(() => loadParties(), 100); } },
            { id: 'nickname', title: 'My Info', icon: <UserIcon className="h-8 w-8 mb-2" />, onClick: () => { setCurrentView('nickname' as const); setTimeout(() => loadParties(), 100); } },
            { id: 'bar-tab', title: 'Bar Tab', icon: <Wine className="h-8 w-8 mb-2" />, onClick: () => { setCurrentView('bar-tab' as const); setTimeout(() => loadParties(), 100); } },
            { id: 'bar-tab-scanner', title: 'Bartab Scanner', icon: <ScanBarcode className="h-8 w-8 mb-2" />, onClick: () => { setCurrentView('bar-tab-scanner' as const); setTimeout(() => loadParties(), 100); } },
            { id: 'faq', title: 'FAQ & Contact', icon: <Users className="h-8 w-8 mb-2" />, onClick: () => { setCurrentView('faq' as const); setTimeout(() => loadParties(), 100); } },
            { id: 'theme-changer', title: `Change Theme\n(${getThemeDisplayName(currentTheme)})`, icon: <Settings2 className="h-8 w-8 mb-2" />, onClick: cycleTheme },
            { id: 'message', title: 'Message Users', icon: <MessageCircle className="h-8 w-8 mb-2" />, onClick: () => { setCurrentView('message' as const); setTimeout(() => loadParties(), 100); } },
            ...(onManageSubAdmins ? [{ id: 'manage-sub-admins', title: 'Manage Sub-Admins', icon: <UserPlus className="h-8 w-8 mb-2" />, onClick: onManageSubAdmins }] : []),
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
              <div className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border border-border/50 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-foreground">Upcoming Parties</h3>
                      <p className="text-sm text-muted-foreground">Manage your upcoming events</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortAscending(!sortAscending)}
                      className="border-primary/30 bg-background/80 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                    >
                      {sortAscending ? "Latest First" : "Soonest First"}
                    </Button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                    {upcomingParties.slice(0, 10).map((party, index) => (
                      <div
                        key={party.id}
                        className="group relative bg-gradient-to-r from-background/80 to-background/60 border border-border/30 rounded-xl p-4 cursor-pointer hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:scale-[1.02]"
                        onClick={() => {
                          setCurrentView('edit-parties');
                          setTimeout(() => {
                            const editButton = document.querySelector(`[data-party-id="${party.id}"] button[aria-label*="Edit"]`) as HTMLButtonElement;
                            if (editButton) editButton.click();
                          }, 100);
                        }}
                      >
                        <div className="flex items-center gap-4">
                          {party.photo_url && (
                            <div className="relative overflow-hidden rounded-lg">
                              <img 
                                src={party.photo_url} 
                                alt={party.name}
                                className="w-20 h-20 object-cover transition-transform duration-300 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                          )}
                          <div className="flex-1 space-y-2">
                            <div className="font-bold text-lg text-foreground group-hover:text-primary transition-colors duration-300">
                              {party.name}
                            </div>
                            {party.productions?.name && (
                              <div className="text-xs text-muted-foreground/80 flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                <span>{party.productions.name}</span>
                              </div>
                            )}
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span>{new Date(party.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                              </div>
                              {(party.start_time || party.end_time) && (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-primary" />
                                  <span className="text-xs">
                                    {party.start_time && `${party.start_time}`}
                                    {party.start_time && party.end_time && ' - '}
                                    {party.end_time && `${party.end_time}`}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                                <Users className="h-3 w-3" />
                                <span>{party.approved_count || 0} guests</span>
                              </div>
                              {index === 0 && sortAscending && (
                                <div className="bg-green-500/10 text-green-600 px-3 py-1 rounded-full text-xs font-semibold">
                                  Next Event
                                </div>
                              )}
                            </div>
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
      <ScrollToTop />
    </div>
  );
};

export default AdminDashboard;