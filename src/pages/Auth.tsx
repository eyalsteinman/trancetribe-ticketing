import { useState } from 'react';
import ModernAuthForm from '@/components/auth/ModernAuthForm';
import ModernFooter from '@/components/ui/modern-footer';
import ProductionBrowser from '@/components/ProductionBrowser';
import LanguageSelector from '@/components/LanguageSelector';
import AdminPasswordForm from '@/components/AdminPasswordForm';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AuthPage = () => {
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [pendingAdminSignup, setPendingAdminSignup] = useState<{email: string, password: string} | null>(null);
  const { toast } = useToast();

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
          toast({
            title: "Signup Failed",
            description: signupError.message,
            variant: "destructive",
          });
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
        toast({
          title: "Success",
          description: "Admin account already exists and is active",
        });
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
        toast({
          title: "Error",
          description: "Failed to assign admin role",
          variant: "destructive",
        });
      } else {
        console.log('Admin role assigned successfully');
        toast({
          title: "Success",
          description: "Admin account created successfully!",
        });
      }
      
    } catch (error: any) {
      console.error('=== ADMIN SIGNUP ERROR ===');
      console.error('Error details:', error);
      toast({
        title: "Error",
        description: "Failed to create admin account",
        variant: "destructive",
      });
    }
  };

  if (showAdminPassword) {
    return (
      <div className="page-container">
        <AdminPasswordForm 
          onSuccess={handleAdminPasswordSuccess}
          onBack={handleAdminPasswordBack}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Parallax Background Elements */}
      <div className="fixed inset-0 overflow-hidden opacity-30">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-20 h-20 bg-accent/10 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 left-1/4 w-24 h-24 bg-primary/5 rounded-full animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Language Selector - Fixed Top Right */}
      <div className="fixed top-4 right-4 z-40">
        <div className="glass p-2 rounded-xl">
          <LanguageSelector />
        </div>
      </div>

      {/* Production Browser */}
      <div className="content-wrapper py-8">
        <ProductionBrowser onLoginPrompt={() => {}} carouselOnly />
      </div>

      {/* Main Auth Form */}
      <div className="content-wrapper">
        <ModernAuthForm 
          onShowAdminPassword={showAdminPasswordForm}
          pendingAdminSignup={pendingAdminSignup}
        />
      </div>

      {/* Modern Footer */}
      <ModernFooter />
    </div>
  );
};

export default AuthPage;