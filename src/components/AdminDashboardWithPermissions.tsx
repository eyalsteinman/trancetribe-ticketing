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
import AdminSignupNew from './AdminSignupNew';
import { useTheme } from '@/hooks/useDarkMode';

interface AdminDashboardWithPermissionsProps {
  user: User;
}

interface AdminProfile {
  admin_level: 'level1' | 'level2' | 'level3';
  allowed_tiles: string[];
}

const AdminDashboardWithPermissions = ({ user }: AdminDashboardWithPermissionsProps) => {
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [loading, setLoading] = useState(true);
  
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();

  useEffect(() => {
    loadAdminProfile();
  }, [user.id]);

  const loadAdminProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_profiles')
        .select('admin_level, allowed_tiles')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error querying admin_profiles:', error);
      }

      if (data) {
        setAdminProfile(data as AdminProfile);
      } else {
        // No explicit admin profile found. If the user is an admin, grant super admin access (backward compatibility)
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin');

        if (rolesError) {
          console.error('Error checking user_roles:', rolesError);
        }

        if (roles && roles.length > 0) {
          setAdminProfile({
            admin_level: 'level3',
            allowed_tiles: [
              'registered-users',
              'guest-list',
              'productions',
              'parties',
              'messages',
              'games',
              'bar-tabs',
              'manage-admins',
            ]
          });
        } else {
          setAdminProfile({
            admin_level: 'level1',
            allowed_tiles: []
          });
        }
      }
    } catch (error) {
      console.error('Unexpected error loading admin profile:', error);
      // Fallback to restricted access
      setAdminProfile({
        admin_level: 'level1',
        allowed_tiles: []
      });
    } finally {
      setLoading(false);
    }
  };

  const hasAccess = (tileId: string) => {
    if (!adminProfile) return false;
    return adminProfile.allowed_tiles.includes(tileId);
  };

  const isSuperAdmin = () => {
    const result = adminProfile?.admin_level === 'level3' || adminProfile?.allowed_tiles.includes('manage-admins');
    console.log('isSuperAdmin check:', { adminProfile, result });
    return result;
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen p-4 transition-colors duration-500 flex items-center justify-center"
        style={{ backgroundColor }}
      >
        <div className="text-center">
          <div className="text-lg font-semibold" style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}>
            Loading admin dashboard...
          </div>
        </div>
      </div>
    );
  }

  console.log('Current view:', currentView, 'isSuperAdmin:', isSuperAdmin());
  
  if (currentView === 'manage-admins' && isSuperAdmin()) {
    return <AdminSignupNew onBack={() => setCurrentView('dashboard')} />;
  }

  // Here you would render tiles based on adminProfile.allowed_tiles
  return (
    <div 
      className="min-h-screen p-4 transition-colors duration-500"
      style={{ backgroundColor }}
    >
      <PageHeader
        title="Admin Dashboard"
        isBackgroundDark={isBackgroundDark}
      />
      
      <div className="max-w-4xl mx-auto pt-20 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 
              className="text-xl font-semibold"
              style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}
            >
              Welcome, Admin
            </h2>
            <p 
              className="text-sm opacity-75"
              style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}
            >
              Level: {adminProfile?.admin_level.replace('level', 'Level ')}
            </p>
          </div>
          <Button variant="outline" onClick={() => supabase.auth.signOut()}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {hasAccess('registered-users') && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Manage registered users</p>
              </CardContent>
            </Card>
          )}

          {hasAccess('guest-list') && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Guest List
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">View event guests</p>
              </CardContent>
            </Card>
          )}

          {hasAccess('parties') && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Parties
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Create and manage parties</p>
              </CardContent>
            </Card>
          )}

          {hasAccess('productions') && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Productions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Manage productions</p>
              </CardContent>
            </Card>
          )}

          {hasAccess('messages') && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Send messages to users</p>
              </CardContent>
            </Card>
          )}

          {hasAccess('games') && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Gamepad2 className="h-4 w-4" />
                  Games
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Admin games and fun</p>
              </CardContent>
            </Card>
          )}

          {hasAccess('bar-tabs') && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wine className="h-4 w-4" />
                  Bar Tabs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Manage bar transactions</p>
              </CardContent>
            </Card>
          )}

          {isSuperAdmin() && (
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                console.log('Manage Admins clicked, setting currentView to manage-admins');
                setCurrentView('manage-admins');
              }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Manage Admins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Add new admins</p>
              </CardContent>
            </Card>
          )}
        </div>

        {adminProfile?.allowed_tiles.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <p>No tiles have been assigned to your admin account.</p>
                <p className="text-sm mt-2">Please contact a super admin to configure your permissions.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardWithPermissions;