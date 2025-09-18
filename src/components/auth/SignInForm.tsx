import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface SignInFormProps {}

export const SignInForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSignIn = async () => {
    if (!email || !password) {
      toast({
        title: t('error'),
        description: t('fields_required'),
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // Successfully signed in - the app will handle the redirect
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        toast({
          title: t('error'),
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: t('error'),
        description: t('google_signin_failed'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        toast({
          title: t('error'),
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: t('error'),
        description: t('facebook_signin_failed'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {t('email')} *
        </label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('enter_email')}
          required
          className="glass-input text-foreground placeholder:text-muted-foreground h-12 text-base"
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {t('password')} *
        </label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('enter_password')}
          required
          className="glass-input text-foreground placeholder:text-muted-foreground h-12 text-base"
        />
      </div>

      <Button 
        onClick={handleSignIn}
        disabled={loading}
        className="w-full glass-button btn-press bg-primary hover:bg-primary-hover text-primary-foreground h-12 text-base font-semibold rounded-lg transition-all duration-300 hover:shadow-glow disabled:opacity-50"
      >
        {loading ? t('processing') : t('sign_in')}
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-glass-border" />
        </div>
        <div className="relative flex justify-center text-sm uppercase">
          <span className="bg-background/80 backdrop-blur-sm px-4 text-muted-foreground font-medium">
            {t('or_continue_with')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="glass-button btn-press border-glass-border text-foreground hover:bg-secondary/50 h-12 transition-all duration-300"
        >
          {t('google')}
        </Button>
        <Button
          variant="outline"
          onClick={handleFacebookLogin}
          disabled={loading}
          className="glass-button btn-press border-glass-border text-foreground hover:bg-accent/50 h-12 transition-all duration-300"
        >
          {t('facebook')}
        </Button>
      </div>
    </div>
  );
};