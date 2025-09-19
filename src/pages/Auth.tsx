import { useState } from 'react';
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
  const { backgroundColor, isBackgroundDark } = useBackground();
  const { t, isRTL } = useLanguage();

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
    <div 
      className={`auth-bg min-h-screen w-full flex items-center justify-center p-4 ${isRTL ? 'rtl' : 'ltr'} relative overflow-hidden`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/20 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/10 blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-primary/30 blur-2xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-32 left-20 w-48 h-48 bg-accent/20 blur-2xl animate-pulse delay-3000"></div>
      </div>

      <div className="w-full space-y-8 relative z-20 animate-slide-up">
        <div className="float-animation">
          <ProductionBrowser onLoginPrompt={() => setIsUserLogin(true)} carouselOnly />
        </div>

        <div className="w-full flex flex-col items-center">
          <div className={`text-center ${isRTL ? 'space-y-4' : 'space-y-2'} mb-8 animate-slide-in-blur`}>
            <div className="mb-6">
              <LanguageSelector />
            </div>
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="text-center">
                <RtlText 
                  text={t('trance_tribes')} 
                  className="text-4xl font-bold whitespace-pre-line bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent text-center block"
                />
              </div>
              <RtlText 
                text={t('choose_access_type')} 
                className="text-muted-foreground text-lg text-center" 
              />
            </div>
          </div>

          <div className={`max-w-md mx-auto w-full ${isRTL ? 'rtl-form' : ''} animate-slide-in-blur delay-200`}>
            <AuthForm 
              onShowAdminPassword={showAdminPasswordForm}
              pendingAdminSignup={pendingAdminSignup}
              isUserLogin={isUserLogin}
              onToggleUserLogin={() => setIsUserLogin(!isUserLogin)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;