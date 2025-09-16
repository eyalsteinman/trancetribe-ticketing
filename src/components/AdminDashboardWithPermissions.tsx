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
        .single();

      if (error) {
        // If no admin profile found, assume super admin (existing admins)
        console.log('No admin profile found, assuming super admin');
        setAdminProfile({
          admin_level: 'level3',
          allowed_tiles: [
            'registered-users', 'guest-list', 'productions', 'parties', 
            'manage-admins', 'messages', 'games', 'bar-tabs', 'analytics'
          ]
        });
      } else {
        setAdminProfile(data);
      }
    } catch (error) {
      console.error('Error loading admin profile:', error);
      // Fallback to super admin
      setAdminProfile({
        admin_level: 'level3',
        allowed_tiles: [
          'registered-users', 'guest-list', 'productions', 'parties', 
          'manage-admins', 'messages', 'games', 'bar-tabs', 'analytics'
        ]
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
    return adminProfile?.admin_level === 'level3' || adminProfile?.allowed_tiles.includes('manage-admins');
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-card/20 p-3 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl sm:text-2xl font-bold text-primary animate-pulse">
            Loading admin dashboard...
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'manage-admins' && isSuperAdmin()) {
    return <AdminSignupNew onBack={() => setCurrentView('dashboard')} />;
  }

  // Here you would render tiles based on adminProfile.allowed_tiles
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-card/20 p-3 sm:p-6">
      <div className="relative flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex-1">
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Welcome, Admin
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground font-medium">
              Level: {adminProfile?.admin_level.replace('level', 'Level ')}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => supabase.auth.signOut()}
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 hover:bg-card hover:border-primary/50 transition-all duration-300 hover:scale-105"
          aria-label="Sign Out"
        >
          <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {hasAccess('registered-users') && (
          <Card className="cursor-pointer group hover:scale-105 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-3">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary group-hover:text-accent transition-colors" />
                <span className="font-bold">Users</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Manage registered users</p>
            </CardContent>
          </Card>
        )}

        {hasAccess('guest-list') && (
          <Card className="cursor-pointer group hover:scale-105 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-3">
                <List className="h-5 w-5 sm:h-6 sm:w-6 text-primary group-hover:text-accent transition-colors" />
                <span className="font-bold">Guest List</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">View event guests</p>
            </CardContent>
          </Card>
        )}

        {hasAccess('parties') && (
          <Card className="cursor-pointer group hover:scale-105 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-3">
                <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-primary group-hover:text-accent transition-colors" />
                <span className="font-bold">Parties</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Create and manage parties</p>
            </CardContent>
          </Card>
        )}

        {hasAccess('productions') && (
          <Card className="cursor-pointer group hover:scale-105 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-3">
                <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary group-hover:text-accent transition-colors" />
                <span className="font-bold">Productions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Manage productions</p>
            </CardContent>
          </Card>
        )}

        {hasAccess('messages') && (
          <Card className="cursor-pointer group hover:scale-105 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-3">
                <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary group-hover:text-accent transition-colors" />
                <span className="font-bold">Messages</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Send messages to users</p>
            </CardContent>
          </Card>
        )}

        {hasAccess('games') && (
          <Card className="cursor-pointer group hover:scale-105 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-3">
                <Gamepad2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary group-hover:text-accent transition-colors" />
                <span className="font-bold">Games</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Admin games and fun</p>
            </CardContent>
          </Card>
        )}

        {hasAccess('bar-tabs') && (
          <Card className="cursor-pointer group hover:scale-105 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-3">
                <Wine className="h-5 w-5 sm:h-6 sm:w-6 text-primary group-hover:text-accent transition-colors" />
                <span className="font-bold">Bar Tabs</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Manage bar transactions</p>
            </CardContent>
          </Card>
        )}

        {isSuperAdmin() && (
          <Card 
            className="cursor-pointer group hover:scale-105 transition-all duration-300"
            onClick={() => setCurrentView('manage-admins')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-3">
                <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary group-hover:text-accent transition-colors" />
                <span className="font-bold">Manage Admins</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Add new admins</p>
            </CardContent>
          </Card>
        )}
      </div>

      {adminProfile?.allowed_tiles.length === 0 && (
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <p>No tiles have been assigned to your admin account.</p>
              <p className="text-sm mt-2">Please contact a super admin to configure your permissions.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboardWithPermissions;