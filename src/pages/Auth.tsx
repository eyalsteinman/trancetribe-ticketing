import { useState } from 'react';
import { AuthForm } from '@/components/auth/AuthForm';
import Footer from '@/components/ui/footer';
import { useBackground } from '@/contexts/BackgroundContext';
import ProductionBrowser from '@/components/ProductionBrowser';
import LanguageSelector from '@/components/LanguageSelector';
import AdminPasswordForm from '@/components/AdminPasswordForm';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

const AuthPage = () => {
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isUserLogin, setIsUserLogin] = useState(false);
  const [pendingAdminSignup, setPendingAdminSignup] = useState<{email: string, password: string} | null>(null);
  const { backgroundColor, isBackgroundDark } = useBackground();

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
    <div className="min-h-screen w-full bg-gradient-mesh overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 animate-pulse-slow"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-radial from-primary/30 to-transparent rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-radial from-accent/30 to-transparent rounded-full blur-3xl animate-float-delayed"></div>
      
      {/* Floating particles */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-ping opacity-40"></div>
        <div className="absolute top-3/4 left-3/4 w-1 h-1 bg-accent rounded-full animate-ping opacity-60 delay-1000"></div>
        <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-secondary rounded-full animate-ping opacity-50 delay-500"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-6 lg:gap-8 items-center">
          
          {/* Left side - Hero Section */}
          <div className="text-center lg:text-left space-y-4 lg:space-y-6 order-2 lg:order-1">
            <div className="relative">
              <LanguageSelector />
              <div className="mt-4 lg:mt-6">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-fade-in leading-tight">
                  TRANCE
                  <br />
                  <span className="text-glow">TRIBES</span>
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground font-medium mt-3 lg:mt-4 animate-fade-in delay-200 px-4 lg:px-0">
                  Join the ultimate electronic music community
                </p>
                <div className="flex flex-wrap gap-2 lg:gap-3 justify-center lg:justify-start mt-4 lg:mt-6 animate-fade-in delay-300 px-4 lg:px-0">
                  <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary text-xs sm:text-sm">
                    🎵 Events
                  </Badge>
                  <Badge variant="outline" className="bg-accent/10 border-accent/30 text-accent text-xs sm:text-sm">
                    🎮 Games
                  </Badge>
                  <Badge variant="outline" className="bg-secondary/10 border-secondary/30 text-secondary text-xs sm:text-sm">
                    👥 Community
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Production Browser */}
            <div className="animate-fade-in delay-500">
              <ProductionBrowser onLoginPrompt={() => setIsUserLogin(true)} carouselOnly />
            </div>
          </div>

          {/* Right side - Auth Form */}
          <div className="order-1 lg:order-2 animate-fade-in delay-400 w-full max-w-md mx-auto lg:max-w-none">
            <div className="bg-glass backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 sm:p-6 lg:p-8 shadow-neon">
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
    </div>
  );
};

export default AuthPage;