import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useBackground } from '@/contexts/BackgroundContext';
import SplashScreen from '@/components/SplashScreen';
import AuthPage from './Auth';
import UserDashboard from '@/components/UserDashboard';
import AdminDashboard from '@/components/AdminDashboard';
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
    console.log('🔐 Checking admin role for user:', userId);
    try {
      const { data, error } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin');
      
      console.log('👑 Admin role check result:', { data, error, userId });
      const isAdminUser = data && data.length > 0;
      console.log('🎯 Final admin status:', isAdminUser);
      setIsAdmin(isAdminUser);
    } catch (error) {
      console.error('💥 Error checking admin role:', error);
      setIsAdmin(false);
    } finally {
      console.log('🏁 Admin check finished, setting loading to false');
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
    console.log('⏳ Still loading...', { 
      loading, 
      profileLoading, 
      user: user?.id, 
      isAdmin, 
      timestamp: new Date().toISOString() 
    });
    
    return (
      <div 
        className="min-h-screen flex items-center justify-center transition-colors duration-500 bg-background"
      >
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <h1 className="text-2xl font-bold text-foreground">Loading...</h1>
          <p className="text-muted-foreground">
            {loading ? 'Checking authentication...' : 'Loading profile...'}
          </p>
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
    return <AdminDashboard user={user} />;
  }

  console.log('User is regular user, showing user dashboard');
  return <UserDashboard user={user} />;
};

export default Index;