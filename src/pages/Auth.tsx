import { useState } from 'react';
import { AuthForm } from '@/components/auth/AuthForm';
import { Button } from '@/components/ui/button';
import { useBackground } from '@/contexts/BackgroundContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ProductionBrowser from '@/components/ProductionBrowser';
import LanguageSelector from '@/components/LanguageSelector';
import RtlText from '@/components/RtlText';
import AdminPasswordForm from '@/components/AdminPasswordForm';
import ModernFooter from '@/components/ui/modern-footer';
import { supabase } from '@/integrations/supabase/client';
import { Chrome, Facebook } from 'lucide-react';

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
      className={`min-h-screen w-full bg-background text-foreground overflow-hidden ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Animated background */}
      <div className="fixed inset-0 gradient-primary opacity-30"></div>
      <div className="fixed inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-electric-blue/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/2 w-48 h-48 bg-neon-pink/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Language selector - positioned absolutely */}
        <div className="absolute top-4 right-4 z-20">
          <LanguageSelector />
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-8">
            {/* Production Browser */}
            <div className="animate-fade-in">
              <ProductionBrowser onLoginPrompt={() => setIsUserLogin(true)} carouselOnly />
            </div>

            {/* Header */}
            <div className="text-center space-y-4 animate-fade-in delay-300">
              <RtlText 
                text={t('trance_tribes')} 
                className="text-5xl font-bold whitespace-pre-line gradient-primary bg-clip-text text-transparent"
              />
              <RtlText 
                text={t('choose_access_type')} 
                className="text-lg text-muted-foreground"
              />
            </div>

            {/* Auth Form with glass effect */}
            <div className={`glass p-8 rounded-3xl border border-white/10 animate-scale-in delay-500 ${isRTL ? 'rtl-form' : ''}`}>
              <AuthForm 
                onShowAdminPassword={showAdminPasswordForm}
                pendingAdminSignup={pendingAdminSignup}
                isUserLogin={isUserLogin}
                onToggleUserLogin={() => setIsUserLogin(!isUserLogin)}
              />
              
              {/* Social Login Buttons */}
              <div className="mt-6 space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-background/50 text-muted-foreground">or continue with</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="w-full">
                    <Chrome className="h-4 w-4 mr-2" />
                    Google
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Facebook className="h-4 w-4 mr-2" />
                    Facebook
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <ModernFooter />
      </div>
    </div>
  );
};

export default AuthPage;