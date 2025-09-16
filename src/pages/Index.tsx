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

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const { backgroundColor, isBackgroundDark } = useBackground();

  const checkProfileCompletion = async (userId: string) => {
    console.log('📊 Checking profile completion for user:', userId);
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone_number, email')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching profile:', error);
        setIsProfileComplete(false);
        return false;
      }

      if (profile) {
        const isComplete = !!(
          profile.first_name && 
          profile.last_name && 
          profile.phone_number && 
          profile.email
        );
        console.log('✅ Profile completion status:', isComplete);
        setIsProfileComplete(isComplete);
        return isComplete;
      } else {
        console.log('❌ No profile found, setting incomplete');
        setIsProfileComplete(false);
        return false;
      }
    } catch (error) {
      console.error('💥 Error in profile completion check:', error);
      setIsProfileComplete(false);
      return false;
    }
  };

  const checkAdminRole = async (userId: string) => {
    console.log('🔐 Checking admin role for user:', userId);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin');
      
      if (error) {
        console.error('❌ Admin role check error:', error);
        setIsAdmin(false);
        return false;
      }
      
      const isAdminUser = data && data.length > 0;
      console.log('🎯 Admin status:', isAdminUser);
      setIsAdmin(isAdminUser);
      return isAdminUser;
    } catch (error) {
      console.error('💥 Error checking admin role:', error);
      setIsAdmin(false);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state change:', event, session?.user?.id || 'no user');
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            // Run checks in parallel but handle each independently
            const [adminRole, profileComplete] = await Promise.allSettled([
              checkAdminRole(session.user.id),
              checkProfileCompletion(session.user.id)
            ]);
            
            // Check if this is a first login
            const isNew = event === 'SIGNED_IN' && session.user.created_at && 
                        new Date(session.user.created_at) > new Date(Date.now() - 5 * 60 * 1000);
            
            if (isNew && mounted) {
              setIsFirstLogin(true);
              setShowOnboarding(true);
            }
            
            console.log('✅ All checks completed, setting loading to false');
          } catch (error) {
            console.error('💥 Error in auth state checks:', error);
          } finally {
            if (mounted) {
              setLoading(false);
            }
          }
        } else {
          // User logged out - reset all states
          if (mounted) {
            setIsAdmin(false);
            setIsFirstLogin(false);
            setShowOnboarding(false);
            setIsProfileComplete(false);
            setLoading(false);
          }
        }
      }
    );

    // Check for existing session
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const [adminResult, profileResult] = await Promise.allSettled([
            checkAdminRole(session.user.id),
            checkProfileCompletion(session.user.id)
          ]);
          
          console.log('✅ Initial session checks completed');
        }
      } catch (error) {
        console.error('💥 Error checking initial session:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    console.log('Showing splash screen');
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (loading) {
    console.log('⏳ Still loading...', { 
      loading, 
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
            Checking authentication and profile...
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
    return <ProfileCompletion onProfileComplete={() => checkProfileCompletion(user.id)} />;
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