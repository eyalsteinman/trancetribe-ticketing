import { useState, useEffect } from 'react';
import { AuthForm } from '@/components/auth/AuthForm';
import Footer from '@/components/ui/footer';
import { useBackground } from '@/contexts/BackgroundContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ProductionBrowser from '@/components/ProductionBrowser';
import LanguageSelector from '@/components/LanguageSelector';
import RtlText from '@/components/RtlText';
import AdminPasswordForm from '@/components/AdminPasswordForm';
import { supabase } from '@/integrations/supabase/client';

const AuthPage = () => {
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isUserLogin, setIsUserLogin] = useState(false);
  const [pendingAdminSignup, setPendingAdminSignup] = useState<{email: string, password: string} | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const { backgroundColor, isBackgroundDark } = useBackground();
  const { t, isRTL } = useLanguage();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAdminPasswordSuccess = async () => {
    setShowAdminPassword(false);
    if (pendingAdminSignup) {
      await handleAdminSignup(pendingAdminSignup.email, pendingAdminSignup.password);
      setPendingAdminSignup(null);
    }
  };

  const handleAdminPasswordBack = () => {
    setShowAdminPassword(false);
    setPendingAdminSignup(null);
  };

  const showAdminPasswordForm = (email: string, password: string) => {
    setPendingAdminSignup({ email, password });
    setShowAdminPassword(true);
  };

  const handleAdminSignup = async (email: string, password: string) => {
    // This function will be called after password verification
    // Include the admin signup logic from the original AuthForm
    try {
      console.log('=== STARTING ADMIN SIGNUP ===');
      console.log('Email:', email);
      
      // Try to sign in first to check if user already exists
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      let userId: string;
      
      if (signInData?.user) {
        // User exists, use existing user ID
        userId = signInData.user.id;
        console.log('User already exists with ID:', userId);
      } else if (signInError?.message?.includes('Invalid login credentials')) {
        // User doesn't exist, create new account
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              display_name: email.split('@')[0]
            }
          }
        });
        
        if (signupError) {
          console.error('Signup failed:', signupError);
          return;
        }

        if (!signupData.user) {
          console.error('No user returned from signup');
          return;
        }

        userId = signupData.user.id;
        console.log('User created successfully with ID:', userId);
        
        // Wait for trigger to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        // Other auth error
        throw signInError;
      }
      
      // Check if user already has admin role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single();

      if (existingRole) {
        console.log('User already has admin privileges');
        return;
      }
      
      // Add admin role
      console.log('Adding admin role...');
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'admin'
        });
      
      if (roleError) {
        console.error('Admin role assignment failed:', roleError);
      } else {
        console.log('Admin role assigned successfully');
      }
      
    } catch (error: any) {
      console.error('=== ADMIN SIGNUP ERROR ===');
      console.error('Error details:', error);
    }
  };

  if (showAdminPassword) {
    return (
      <AdminPasswordForm 
        onSuccess={handleAdminPasswordSuccess}
        onBack={handleAdminPasswordBack}
      />
    );
  }

  return (
    <>
      {/* Animated background */}
      <div className="auth-animated-bg" />
      
      <div 
        className={`min-h-screen w-full relative z-10 flex items-center justify-center p-4 ${isRTL ? 'rtl' : 'ltr'}`}
        dir={isRTL ? 'rtl' : 'ltr'}
        style={{ '--scroll-y': `${scrollY * 0.1}px` } as React.CSSProperties}
      >
        <div className="w-full space-y-8 auth-parallax">
          <div className="auth-glass p-6 rounded-2xl max-w-md mx-auto">
            <ProductionBrowser onLoginPrompt={() => setIsUserLogin(true)} carouselOnly />
          </div>

            <div className="w-full flex flex-col items-center space-y-6">
            {isRTL ? (
              <>
                <div className="w-full max-w-md mx-auto">
                  <AuthForm 
                    onShowAdminPassword={showAdminPasswordForm}
                    pendingAdminSignup={pendingAdminSignup}
                    isUserLogin={isUserLogin}
                    onToggleUserLogin={() => setIsUserLogin(!isUserLogin)}
                  />
                </div>
                <div className="text-center space-y-4">
                  <LanguageSelector />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <h1 className="text-4xl font-bold text-white text-center w-full">
                      {t('trance_tribes')}
                    </h1>
                    <p className="text-white text-center w-full text-sm">
                      {t('choose_access_type')}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="text-center space-y-4">
                  <LanguageSelector />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <h1 className="text-4xl font-bold text-white text-center w-full">
                      {t('trance_tribes')}
                    </h1>
                    <p className="text-white text-center w-full text-sm">
                      {t('choose_access_type')}
                    </p>
                  </div>
                </div>

                <div className="w-full max-w-md mx-auto">
                  <AuthForm 
                    onShowAdminPassword={showAdminPasswordForm}
                    pendingAdminSignup={pendingAdminSignup}
                    isUserLogin={isUserLogin}
                    onToggleUserLogin={() => setIsUserLogin(!isUserLogin)}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthPage;