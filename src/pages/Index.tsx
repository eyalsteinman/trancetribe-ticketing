import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useBackground } from '@/contexts/BackgroundContext';
import SplashScreen from '@/components/SplashScreen';
import AuthPage from './Auth';
import UserDashboard from '@/components/UserDashboard';
import AdminDashboardWithPermissions from '@/components/AdminDashboardWithPermissions';
import ProfileCompletion from '@/components/ProfileCompletion';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { backgroundColor, isBackgroundDark } = useBackground();
  const { isProfileComplete, loading: profileLoading, refetchProfile } = useProfileCompletion();

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin');
      
      console.log('Admin role check:', { data, error, userId });
      setIsAdmin(data && data.length > 0);
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Check if user is admin
          checkAdminRole(session.user.id);
        } else {
          // User logged out - reset all states
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    console.log('Showing splash screen');
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (loading || profileLoading) {
    console.log('Loading state, user:', user, 'isAdmin:', isAdmin, 'profileLoading:', profileLoading);
    return (
      <div 
        className="min-h-screen flex items-center justify-center transition-colors duration-500"
        style={{ 
          backgroundColor
        }}
      >
        <div className="text-center">
          <h1 className="text-xl">Loading...</h1>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('No user, showing auth form');
    return <AuthPage />;
  }

  // Check if user profile is incomplete (for non-admin users)
  if (!isAdmin && !isProfileComplete) {
    console.log('User profile incomplete, showing profile completion');
    return <ProfileCompletion onProfileComplete={refetchProfile} />;
  }

  if (isAdmin) {
    console.log('User is admin, showing admin dashboard');
    return <AdminDashboardWithPermissions user={user} />;
  }

  console.log('User is regular user, showing user dashboard');
  return <UserDashboard user={user} />;
};

export default Index;