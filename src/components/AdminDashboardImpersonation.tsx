import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useBackground } from '@/contexts/BackgroundContext';
import { ArrowLeft } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import AdminDashboard from './AdminDashboard';

interface AdminDashboardImpersonationProps {
  superAdminUser: User;
  impersonatedAdminId: string;
  onBack: () => void;
}

const AdminDashboardImpersonation = ({ 
  superAdminUser, 
  impersonatedAdminId, 
  onBack 
}: AdminDashboardImpersonationProps) => {
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();

  useEffect(() => {
    loadImpersonatedUser();
  }, [impersonatedAdminId]);

  const loadImpersonatedUser = async () => {
    try {
      // Get the impersonated admin's profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', impersonatedAdminId)
        .single();

      if (error || !profile) {
        toast({
          title: "Error",
          description: "Failed to load admin profile",
          variant: "destructive"
        });
        onBack();
        return;
      }

      // Create a mock user object for the impersonated admin
      const mockUser: User = {
        id: impersonatedAdminId,
        aud: 'authenticated',
        role: 'authenticated',
        email: profile.email || '',
        email_confirmed_at: new Date().toISOString(),
        phone: '',
        confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {
          display_name: profile.display_name,
          first_name: profile.first_name,
          last_name: profile.last_name
        },
        identities: [],
        created_at: profile.created_at,
        updated_at: new Date().toISOString()
      };

      setImpersonatedUser(mockUser);
    } catch (error) {
      console.error('Error loading impersonated user:', error);
      toast({
        title: "Error",
        description: "Failed to load admin profile",
        variant: "destructive"
      });
      onBack();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen p-4 transition-colors duration-500 flex items-center justify-center"
        style={{ backgroundColor }}
      >
        <div className="text-center" style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}>
          Loading admin dashboard...
        </div>
      </div>
    );
  }

  if (!impersonatedUser) {
    return (
      <div 
        className="min-h-screen p-4 transition-colors duration-500 flex items-center justify-center"
        style={{ backgroundColor }}
      >
        <div className="text-center" style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}>
          Failed to load admin dashboard
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Super Admin Header */}
      <div className="fixed top-4 left-4 right-4 z-50 bg-destructive text-foreground p-3 rounded-lg shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-foreground hover:bg-destructive"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="font-semibold">Super Admin Mode</div>
            <div className="text-sm opacity-90">
              Viewing: {impersonatedUser.email} | Super Admin: {superAdminUser.email}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Dashboard with padding for header */}
      <div className="pt-20">
        <AdminDashboard user={impersonatedUser} />
      </div>
    </div>
  );
};

export default AdminDashboardImpersonation;