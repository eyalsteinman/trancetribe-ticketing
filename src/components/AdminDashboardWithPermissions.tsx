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
import SuperAdminManageAdmins from './SuperAdminManageAdmins';
import AdminDashboardImpersonation from './AdminDashboardImpersonation';
import AdminDashboard from './AdminDashboard';
import RegularAdminManageSubAdmins from './RegularAdminManageSubAdmins';

interface AdminDashboardWithPermissionsProps {
  user: User;
}

interface AdminProfile {
  admin_level: 'level1' | 'level2' | 'level3';
  allowed_tiles: string[];
  is_super_admin: boolean;
}

const AdminDashboardWithPermissions = ({ user }: AdminDashboardWithPermissionsProps) => {
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [impersonatedAdminId, setImpersonatedAdminId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showSubAdminManager, setShowSubAdminManager] = useState(false);
  
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();

  useEffect(() => {
    loadAdminProfile();
  }, [user.id]);

  const loadAdminProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_profiles')
        .select('admin_level, allowed_tiles, is_super_admin')
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
          ],
          is_super_admin: user.email === 'eyalsteinman@gmail.com'
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
        ],
        is_super_admin: user.email === 'eyalsteinman@gmail.com'
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
    return adminProfile?.is_super_admin || user.email === 'eyalsteinman@gmail.com';
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

  if (currentView === 'manage-admins' && isSuperAdmin()) {
    return <SuperAdminManageAdmins 
      user={user} 
      onBack={() => setCurrentView('dashboard')}
      onViewAdminDashboard={(adminId: string) => {
        setImpersonatedAdminId(adminId);
        setCurrentView('impersonate-admin');
      }}
    />;
  }

  if (currentView === 'impersonate-admin' && impersonatedAdminId) {
    return <AdminDashboardImpersonation
      superAdminUser={user}
      impersonatedAdminId={impersonatedAdminId}
      onBack={() => setCurrentView('manage-admins')}
    />;
  }

  // For super admin with manage admins access, wrap AdminDashboard with super admin banner
  if (isSuperAdmin()) {
    return (
      <div className="relative">
        {/* Super Admin Banner */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-purple-800 text-white p-2 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3 ml-4">
            <Badge variant="secondary" className="bg-white text-purple-900 font-semibold">
              Super Admin
            </Badge>
            <span className="text-sm">{user.email}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('manage-admins')}
            className="text-white hover:bg-purple-700 mr-4"
          >
            <UserCheck className="h-4 w-4 mr-2" />
            Manage Admins
          </Button>
        </div>
        
        {/* Admin Dashboard with padding for banner */}
        <div className="pt-12">
          <AdminDashboard user={user} />
        </div>
      </div>
    );
  }

  // For regular admins, show sub-admin manager if requested
  if (showSubAdminManager) {
    return <RegularAdminManageSubAdmins
      user={user}
      onBack={() => setShowSubAdminManager(false)}
    />;
  }

  // For regular admins, pass the sub-admin manager callback to AdminDashboard
  return <AdminDashboard user={user} onManageSubAdmins={() => setShowSubAdminManager(true)} />;
};

export default AdminDashboardWithPermissions;