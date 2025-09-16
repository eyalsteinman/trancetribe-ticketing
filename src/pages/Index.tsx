import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useBackground } from '@/contexts/BackgroundContext';
import SplashScreen from '@/components/SplashScreen';
import AuthPage from './Auth';
import UserDashboard from '@/components/UserDashboard';
import AdminDashboard from '@/components/AdminDashboard';
import ProfileCompletion from '@/components/ProfileCompletion';
import OnboardingFlow from '@/components/OnboardingFlow';
import WelcomeToast from '@/components/WelcomeToast';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const { backgroundColor, isBackgroundDark } = useBackground();
  const { isProfileComplete, loading: profileLoading, refetchProfile } = useProfileCompletion();

  const checkAdminRole = async (userId: string) => {
    console.log('🔐 Checking admin role for user:', userId);
    try {
      // Add timeout to prevent hanging
      const adminPromise = supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin');
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Admin check timeout')), 10000)
      );
      
      const { data, error } = await Promise.race([
        adminPromise, 
        timeoutPromise
      ]) as any;
      
      console.log('👑 Admin role check result:', { data, error, userId });
      const isAdminUser = data && data.length > 0;
      console.log('🎯 Final admin status:', isAdminUser);
      setIsAdmin(isAdminUser);
      return isAdminUser;
    } catch (error) {
      console.error('💥 Error checking admin role:', error);
      // If it's a timeout, assume not admin and continue
      if (error.message === 'Admin check timeout') {
        console.log('⏰ Admin check timeout, assuming not admin');
      }
      setIsAdmin(false);
      return false;
    } finally {
      console.log('🏁 Admin check finished, setting loading to false');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Add fallback timeout for the entire loading process
    const fallbackTimeout = setTimeout(() => {
      console.log('⚠️ Global fallback timeout triggered - forcing loading to false');
      setLoading(false);
    }, 15000);

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Check if user is admin
          const adminRole = await checkAdminRole(session.user.id);
          
          // Check if this is a first login by looking at user metadata
          const isNew = event === 'SIGNED_IN' && session.user.created_at && 
                       new Date(session.user.created_at) > new Date(Date.now() - 5 * 60 * 1000); // Last 5 minutes
          
          if (isNew) {
            setIsFirstLogin(true);
            setShowOnboarding(true);
          }
        } else {
          // User logged out - reset all states
          setIsAdmin(false);
          setIsFirstLogin(false);
          setShowOnboarding(false);
          setLoading(false);
        }
        
        clearTimeout(fallbackTimeout);
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
        clearTimeout(fallbackTimeout);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallbackTimeout);
    };
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

  // Show onboarding for first-time users
  if (showOnboarding) {
    return (
      <>
        {isAdmin ? <AdminDashboard user={user} /> : <UserDashboard user={user} />}
        <OnboardingFlow 
          userType={isAdmin ? 'admin' : 'user'} 
          onComplete={() => setShowOnboarding(false)} 
        />
        {isFirstLogin && (
          <WelcomeToast 
            userType={isAdmin ? 'admin' : 'user'}
            userName={user.user_metadata?.display_name || user.email}
          />
        )}
      </>
    );
  }

  if (isAdmin) {
    console.log('User is admin, showing admin dashboard');
    return <AdminDashboard user={user} />;
  }

  console.log('User is regular user, showing user dashboard');
  return <UserDashboard user={user} />;
};

export default Index;